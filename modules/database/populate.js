import mongoose from "mongoose"
import { Logger } from "modules/logger.js";

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
	constructor(known = []) {
		this.entries = {}
		for(const knownDocument of known) {
			this.saveKnownDocument(known)
		}
	}

	saveKnownDocument(knownDocument) {
		const modelName = knownDocument.constructor.modelName
		if(!modelName) return
		this.entries[modelName] ||= {		
			model: mongoose.model(modelName),
			documentIDs: [],
			callbacks: [],
			results: []
		}
		this.entries[modelName].results.push(knownDocument)
	}

	registerPopulateCallback(ref, IDs, callback) {
		this.entries[ref] ||= {
			model: mongoose.model(ref),
			documentIDs: [],
			callbacks: [],
			results: []
		}
		this.entries[ref].callbacks.push(callback)
		let count = 0
		for(const id of IDs) {
			if(this.entries[ref].documentIDs.includes(id)) continue
			this.entries[ref].documentIDs.push(id)
			count += 1
		}
		return count
	}

	async findPopulatable(graph, document, options) {
		if(typeof graph == "string") graph = [graph]
		if(Array.isArray(graph)) graph = graph.reduce((p, c) => (p[c] = {}, p), {})
		
		let findCounter = 0
		for(const key in graph) {
			if(typeof key != "string") throw Error("Invalid populate path")
			if(document.populated(key)) {
				const subGraph = graph[key]
				const subDocument = document[key]
				if(subGraph && subDocument) {
					if(Array.isArray(subDocument)) {
						for(const item of subDocument) {
							findCounter += await this.findPopulatable(subGraph, item, options)
						}
					} else if(typeof subDocument == "object") {
						findCounter += await this.findPopulatable(subGraph, subDocument, options)
					}
				}
			} else if(!Array.isArray(document[key]) || document[key].length > 0) {
				let schemaDefinition = document.schema.tree[key]
				if(!schemaDefinition) throw Error(`Unknown populate path ${key}`)
				const arrayPopulate = schemaDefinition instanceof Array
				if(arrayPopulate) schemaDefinition = schemaDefinition[0]

				let ref = schemaDefinition.ref
				if(typeof ref == "function") {
					ref = await ref.call(document)
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
				
				findCounter += this.registerPopulateCallback(ref, populateIDs, results => {
					const newArray = []
					for(const subDocument of subDocuments) {
						if(typeof subDocument != "string") continue
						let newDocument = results.find(r => r.id == subDocument)
						if(!newDocument) {
							if(options?.placeholders === false) continue
							newDocument = createFakeDocument(mongoose.model(ref), subDocument)
							results.push(newDocument)
						}
						newDocument.$__parent = document
						newDocument.$__.parent = document
						newArray.push(newDocument)
					}
					document[key] = arrayPopulate ? newArray : newArray[0]
				})
			}
		}
		return findCounter
	}
}


export async function populate(graph, options={}) {
	if(options.log) logger.log(`\n\n\n Populating ${Array.isArray(this) ? "array" : (this.constructor.modelName + " " + this.id)}`)
	options.known = [...(options.known || [])]
	options.known.push(this)

	let parentDocument = this.parent?.(), populationContext
	while(parentDocument && !options.known.includes(parentDocument)) {
		options.known.push(parentDocument)
		populationContext ||= parentDocument.$locals.populationContext
		parentDocument = parentDocument.parent()
	}

	populationContext ||= new PopulationContext(options.known)
	this.$locals ||= {}
	this.$locals.populationContext = populationContext

	let loopCount = 1
	while(true) {
		let findCount = 0
		if(Array.isArray(this)) {
			const unpopulated = []
			for(const index in this) {
				const item = this[index]
				if(options?.exclude?.hasID(item.id)) continue
				if(isPopulated(item)) {
					findCount += await populationContext.findPopulatable(graph, item, options)

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
						let newDocument = results.find(r => r?.id == subDocument.id)
						if(!newDocument) {
							if(options.placeholders === false) continue
							newDocument = createFakeDocument(mongoose.model(options.ref), subDocument.id)
							results.push(newDocument)
						}
						newArray.push(newDocument)
					}
					this.length = 0
					this.push(...newArray)
				})
				findCount += 1
			}
		} else {
			findCount = await populationContext.findPopulatable(graph, this, options)
		}
		
		if(findCount == 0) break
		if(loopCount >= 10) throw Error("Database population loop count exceeded")
		if(options.log) console.log(`Pass ${loopCount}, found ${findCount} populatable paths:`, populationContext.entries)
		loopCount += 1

		const populatePromises = []
		for(const ref in populationContext.entries) {
			const {model, documentIDs, results} = populationContext.entries[ref]
			const queryIDs = documentIDs.filter(id => !results.some(r => r?.id == id))

			const query = async () => {
				let results = []
				if(queryIDs.length) {
					if(options.log) console.log("Requesting", ref, "from DB:", queryIDs)
					results = await model.find({_id: queryIDs}, options.select)
				}
				for(const id of queryIDs) {
					if(!results.some(r => r?.id == id)) {
						if(options.placeholders === false) continue
						results.push(createFakeDocument(model, id, false))
					}
				}
				populationContext.entries[ref].results.push(...results)
				for(const callback of populationContext.entries[ref].callbacks) {
					callback(populationContext.entries[ref].results)
				}
				populationContext.entries[ref].documentIDs = populationContext.entries[ref].documentIDs.filter(id => !queryIDs.includes(id))
				populationContext.entries[ref].callbacks = []
			}

			populatePromises.push(query())
		}
		await Promise.all(populatePromises)
	}
}