import mongoose from "mongoose"
import { Logger } from "modules/logger.js"

const logger = new Logger("Populate", 32)

function createFakeDocument(model, id, placeholder=true) {
	logger.log(`Creating fake ${model.modelName} ${id}`)
	const newDocument = new model({
		_id: id
	})
	newDocument.$locals.unpopulatedPlaceholder = placeholder
	return newDocument
}


export function isPopulated(object) {
	if(typeof object == "string") return false
	if(object?.$locals.unpopulatedPlaceholder) return false
	return true
}


class PopulationContext {
	constructor(known = [], label) {
		this.owner = label
		this.entries = {}
		for(const knownDocument of known) {
			this.saveKnownDocument(knownDocument)
		}
	}

	setupEntry(model) {
		if(this.entries[model]) return
		this.entries[model] = {		
			model: mongoose.model(model),
			required: [],
			callbacks: [],
			results: {}
		}
		return this.entries[model]
	}

	saveKnownDocument(knownDocument) {
		const modelName = knownDocument.constructor.modelName
		if(!modelName) return
		this.setupEntry(modelName)
		this.entries[modelName].results[knownDocument.id] ||= knownDocument
	}

	registerPopulateCallback(ref, IDs, callback) {
		this.setupEntry(ref)
		this.entries[ref].callbacks.push(callback)
		for(const id of IDs) {
			if(this.entries[ref].required.includes(id)) continue
			this.entries[ref].required.push(id)
		}
	}

	findPopulatable(graph, document, options) {
		if(typeof graph == "string") graph = [graph]
		if(Array.isArray(graph)) graph = graph.reduce((p, c) => (p[c] = {}, p), {})
				
		for(const key in graph) {
			if(typeof key != "string") throw Error("Invalid populate path")
			const selectedFields = document[key]?.$locals?.selectedFields
			if(selectedFields && selectedFields != options.select) {
				document[key] = document[key].id
			}
			if(document.populated(key)) {
				const subGraph = graph[key]
				const subDocument = document[key]
				if(subGraph && subDocument) {
					if(Array.isArray(subDocument)) {
						for(const item of subDocument) {
							this.findPopulatable(subGraph, item, options)
						}
					} else if(typeof subDocument == "object") {
						this.findPopulatable(subGraph, subDocument, options)
					}
				}
			} else if(!Array.isArray(document[key]) || document[key].length > 0) {
				let schemaDefinition = document.schema.tree[key]
				if(!schemaDefinition) throw Error(`Unknown populate path ${key}`)
				const arrayPopulate = schemaDefinition instanceof Array
				if(arrayPopulate) schemaDefinition = schemaDefinition[0]

				let ref = schemaDefinition.ref
				if(typeof ref == "function") {
					ref = ref.call(document)
				} else if(typeof ref != "string") {
					throw Error(`Path ${key} cannot be populated, invalid ref`)
				}
				if(!ref) throw Error(`Path ${key} cannot be populated, no ref defined`)

				const subDocuments = arrayPopulate ? [...document[key]] : [document[key]]
				const populateIDs = []

				for(const subDocument of subDocuments) {
					if(isPopulated(subDocument)) continue
					if(options?.exclude?.hasID(subDocument.id)) continue
					populateIDs.push(subDocument.id)
				}
				this.registerPopulateCallback(ref, populateIDs, results => {
					const newArray = []
					for(const subDocument of subDocuments) {
						if(typeof subDocument != "string") continue
						let newDocument = results[subDocument]
						if(!newDocument) {
							if(options?.placeholders === false) continue
							newDocument = createFakeDocument(mongoose.model(ref), subDocument)
							results[subDocument] = newDocument
						}
						newDocument.$__parent = document
						newDocument.$__.parent = document
						newArray.push(newDocument)
					}
					document[key] = arrayPopulate ? newArray : newArray[0]
				})
			}
		}
	}

	countRequired() {
		let count = 0
		for(const model in this.entries) {
			count += this.entries[model].required.length
		}
		return count
	}

	finalise(model) {
		const entry = this.entries[model]
		for(const callback of entry.callbacks) {
			callback(entry.results)
		}
		for(const id in entry.results) {
			const document = entry.results[id]
			if(document.$locals?.selectedFields) {
				delete entry.results[id]
			}
		}
		entry.required = []
		entry.callbacks = []
	}
}


export function populate(graph, options={}) {
	const label = Array.isArray(this) ? "array" : (this.constructor.modelName + " " + this.id)
	if(options.log) logger.log("Populating", label)
	options.known = [...(options.known || [])]
	options.known.push(this)

	let parentDocument = this.parent?.(), populationContext = this.$locals?.populationContext
	while(parentDocument && !options.known.includes(parentDocument)) {
		options.known.push(parentDocument)
		populationContext ||= parentDocument.$locals.populationContext
		parentDocument = parentDocument.parent()
	}

	populationContext ||= new PopulationContext(options.known, label)
	if(!this.$locals) Object.defineProperty(this, "$locals", {value: {}})
	this.$locals.populationContext = populationContext
	if(options.log) logger.log(`Using population context of ${populationContext.owner}`)

	function loop(loopCount=1) {
		if(Array.isArray(this)) {
			const unpopulated = []
			for(const index in this) {
				const item = this[index]
				if(options?.exclude?.hasID(item.id)) continue
				if(isPopulated(item)) {
					populationContext.findPopulatable(graph, item, options)

				} else {
					unpopulated.push(index)
				}
			}
			if(unpopulated.length) {
				if(!options.ref) throw Error("Direct array populate requires ref to be specified")
				populationContext.registerPopulateCallback(options.ref, unpopulated.map(i => this[i].id), results => {
					const newArray = []
					for(const index of unpopulated) {
						const subDocument = this[index]
						let newDocument = results[subDocument.id]
						if(!newDocument) {
							if(options.placeholders === false) continue
							newDocument = createFakeDocument(mongoose.model(options.ref), subDocument.id)
							results[subDocument.id] = newDocument
						}
						newDocument.$locals.populationContext = populationContext
						newArray.push(newDocument)
					}
					this.length = 0
					this.push(...newArray)
				})
			}
		} else {
			populationContext.findPopulatable(graph, this, options)
		}
		
		const findCount = populationContext.countRequired()
		if(findCount == 0) {
			if(options.log) logger.log("Finished!")
			return false
		}
		if(loopCount >= 10) {
			for(const model in populationContext.entries) {
				const required = populationContext.entries[model].required
				if(!required.length) continue
				logger.log(`${model}s still required:`, required)
			}
			throw Error("Database population loop count exceeded")
		}
		if(options.log) logger.log(`Pass ${loopCount}, ${findCount} populatable paths required`)

		const populatePromises = []
		for(const ref in populationContext.entries) {
			const {model, required, results} = populationContext.entries[ref]
			const queryIDs = required.filter(id => !results[id])

			if(queryIDs.length) {
				if(options.sync) {
					logger.log(`Pending ${ref} queries: ${queryIDs.join(", ")}`)
					throw Error("Cannot perform synchronous population with pending database queries")
				}

				const query = async () => {
					if(options.log) logger.log("Requesting", ref, "from DB:", queryIDs)
					const queryResults = await model.find({_id: queryIDs}, options.select)
					for(const id of queryIDs) {
						if(!queryResults.some(r => r?.id == id)) {
							if(options.placeholders === false) continue
							queryResults.push(createFakeDocument(model, id, false))
						}
					}
					for(const doc of queryResults) {
						if(options.select) doc.$locals.selectedFields = options.select
						populationContext.entries[ref].results[doc.id] = doc
					}
					populationContext.finalise(ref)
				}
				
				populatePromises.push(query())

			} else {
				populationContext.finalise(ref)
			}

		}
		return populatePromises.length ? Promise.all(populatePromises) : true
	}

	const documentContext = {
		document: this
	}

	if(options.sync) {
		let loopCount = 1
		while(true) {
			const loopContinuing = loop.call(documentContext.document, loopCount)
			if(!loopContinuing) break
			loopCount += 1
		}

	} else return new Promise(resolve => {
		let loopCount = 1
		function asyncLoop() {
			const loopResult = loop.call(documentContext.document, loopCount)
			if(loopResult instanceof Promise) {
				loopResult.then(() => {
					loopCount += 1
					asyncLoop()
				})
			} else if(loopResult) {
				loopCount += 1
				asyncLoop()
			} else {
				resolve()
			}
		}
		asyncLoop.call(documentContext.document)
	})
}