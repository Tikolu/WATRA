import mongoose from "mongoose"

import shortID from "modules/database/shortID.js"

const MONGO_URI = "mongodb://localhost:27017"

// Helper functions to simplify IDs and arrays of IDs
String.prototype.__defineGetter__("id", function() {
	if(!shortID.validate.test(this)) return undefined
	else return this
})
Object.defineProperty(Array.prototype, "hasID", {
	value: function(id) {
		return this.some(value => value?.id === id)
	}
})

// Globally use custom string IDs
mongoose.plugin(schema => {
	schema.add({
		_id: shortID
	})
})

// Event listeners
const mongooseEvents = {
	beforeDelete: ["pre", /delete/, "query"],
	beforeValidate: ["pre", /validate/],
	afterSave: ["post", /save|update/i],
	afterLoad: ["post", /find/]
}
mongoose.plugin(schema => {
	for(const callbackName in mongooseEvents) {
		const [hookType, eventPattern, listenerType] = mongooseEvents[callbackName]
		const config = {
			query: listenerType == undefined || listenerType == "query",
			document: listenerType == undefined || listenerType == "document"
		}
		schema[hookType](eventPattern, config, async function() {
			if(!schema[callbackName]) return
			const documents = []
			if(this instanceof mongoose.Query) {
				const findQuery = this.model.find(this.getFilter())
				documents.push(...await findQuery)
			} else {
				documents.push(this)
			}
			for(const document of documents) {
				document.$locals.disabledListeners ||= {}
				console.log(`\x1b[32m[MongoDB]\x1b[0m Calling ${callbackName} for ${document.constructor.modelName} ${document.id}`)
				if(document.$locals.disabledListeners[callbackName]) continue
				document.$locals.disabledListeners[callbackName] = true
				await schema[callbackName].call(document)
				document.$locals.disabledListeners[callbackName] = false
			}
		})
	}
})

// Permission system
mongoose.plugin(schema => {
	if(!schema.permissions) return
	schema.virtual("PERMISSIONS").get(function() {
		if(this.$locals.boundPermissionFunctions) {
			return this.$locals.boundPermissionFunctions
		}
		const PERMISSIONS = {}
		for(const permissionName in schema.permissions) {
			const permissionFunction = schema.permissions[permissionName].bind(this)
			PERMISSIONS[permissionName] = permissionFunction
		}
		this.$locals.boundPermissionFunctions = PERMISSIONS
		return PERMISSIONS
	})
})

// Mongoose better populate plugin
mongoose.plugin(schema => {
	schema.methods.populate = async function(graph, options) {
		// console.log(`\n\n\n\x1b[32m[MongoDB]\x1b[0m Populating ${this.constructor.modelName} ${this.id}`)
		
		const populateEntries = {
			[this.constructor.modelName]: {
				model: this.constructor,
				documentIDs: [],
				callbacks: [],
				results: [this]
			}
		}
		function registerPopulateCallback(ref, IDs, callback) {
			populateEntries[ref] ||= {
				model: mongoose.model(ref),
				documentIDs: [],
				callbacks: [],
				results: []
			}
			populateEntries[ref].callbacks.push(callback)
			let count = 0
			for(const id of IDs) {
				if(populateEntries[ref].documentIDs.includes(id)) continue
				populateEntries[ref].documentIDs.push(id)
				count += 1
			}
			return count
		}

		async function findPopulatable(graph, document) {
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
								findCounter += await findPopulatable(subGraph, item)
							}
						} else if(typeof subDocument == "object") {
							findCounter += await findPopulatable(subGraph, subDocument)
						}
					}
				} else if(!Array.isArray(document[key])|| document[key].length > 0) {
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
						if(populateEntries[ref]?.results?.some(r => r.id == subDocument.id)) continue
						populateIDs.push(subDocument.id)
					}

					findCounter += registerPopulateCallback(ref, populateIDs, results => {
						const newArray = []
						for(const subDocument of subDocuments) {
							let newDocument
							if(typeof subDocument == "string") {
								newDocument = results.find(r => r.id == subDocument)
							}
							if(!newDocument) {
								const Model = populateEntries[ref].model
								newDocument = new Model({
									_id: subDocument
								})
								newDocument.$locals.unpopulatedPlaceholder = true
								results.push(newDocument)
							}
							newArray.push(newDocument)
						}
						document[key] = arrayPopulate ? newArray : newArray[0]
					})
				}
			}
			return findCounter
		}

		

		let loopCount = 1
		while(true) {
			const findCount = await findPopulatable(graph, this)
			if(findCount == 0) break
			if(loopCount >= 10) throw Error("Database population loop count exceeded")
			// console.log(`Pass ${loopCount}, found ${findCount} populatable paths:`, populateEntries)
			loopCount += 1

			const populatePromises = []
			for(const ref in populateEntries) {
				const {model, documentIDs, callbacks, results} = populateEntries[ref]
				const queryIDs = documentIDs.filter(id => !results.some(r => r.id == id))

				
				const query = async () => {
					let results = []
					if(queryIDs.length) {
						// console.log("Requesting", ref, "from DB:", queryIDs)
						results =  await model.find({_id: queryIDs})
					}
					populateEntries[ref].results.push(...results)
					for(const callback of callbacks) {
						callback(populateEntries[ref].results)
					}
					populateEntries[ref].documentIDs = []
					populateEntries[ref].callbacks = []
				}

				populatePromises.push(query())
			}
			await Promise.all(populatePromises)
		}
	}
	schema.method("populated", function(key) {
		const schemaDefinition = schema.tree[key]
		if(!schemaDefinition) throw Error(`Unknown populate path ${key}`)
		const arrayPopulate = schemaDefinition instanceof Array
		if(arrayPopulate) return this[key].every(i => isPopulated(i))
		else return isPopulated(this[key])
	}, {suppressWarning: true})
})
function isPopulated(object) {
	if(typeof object == "string") return false
	if(object?.$locals.unpopulatedPlaceholder) return false
	return true
}

// Helper function to create a schema from a class
mongoose.Schema.fromClass = function(classInput) {
	const instance = new classInput()
	const properties = Object.getOwnPropertyNames(instance)
	const schemaDefinition = {}
	for(const property of properties) {
		if(instance[property] === undefined) continue
		schemaDefinition[property] = instance[property]
	}

	const schema = new mongoose.Schema(schemaDefinition)
	schema.loadClass(classInput)
	return schema
}

// Delete function (alias of deleteOne)
mongoose.plugin(schema => schema.methods.delete = function() {
	return this.deleteOne()
})

// Establish connection to database
export async function connect(dbName="main") {
	console.log("\x1b[32m[MongoDB]\x1b[0m Connecting...")
	try {
		await mongoose.connect(MONGO_URI, { dbName })
		
		console.log("\x1b[32m[MongoDB]\x1b[0m Connected!")

		// Initialise all schemas
		await import("modules/schemas/wyjazd.js")
		await import("modules/schemas/funkcja.js")
		await import("modules/schemas/jednostka.js")
		await import("modules/schemas/user.js")

		return true
		
	} catch(error) {
		console.log("\x1b[32m[MongoDB]\x1b[0m Error:", error.message)
		throw error
	}
}

export async function setup() {
	const {default: User} = await import("modules/schemas/user.js")
	const {default: Jednostka} = await import("modules/schemas/jednostka.js")
	const { JednostkaType } = await import("modules/types.js")

	const user = await User.findOne()
	const jednostka = await Jednostka.findOne()

	if(!user && !jednostka) {
		const { FunkcjaType } = await import("modules/types.js")
		
		const newUser = new User()
		const newJednostka = new Jednostka({
			type: JednostkaType.CHORĄGIEW
		})

		await newJednostka.setFunkcja(newUser, FunkcjaType.DRUŻYNOWY)
		console.log("Test user access code:", await newUser.generateAccessCode())
	}
}

export async function clear() {
	console.log("\x1b[32m[MongoDB]\x1b[0m Clearing database...")
	await mongoose.connection.dropDatabase()
}
