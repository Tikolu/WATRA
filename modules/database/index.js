import mongoose from "mongoose"

import shortID from "modules/database/shortID.js"
import { populate, isPopulated } from "modules/database/populate.js"
import { Logger } from "modules/logger.js";

const MONGO_URI = "mongodb://localhost:27017"

const logger = new Logger("MongoDB", 32)

// Helper functions to simplify IDs and arrays of IDs
String.prototype.__defineGetter__("id", function() {
	return this
})
Object.defineProperty(Array.prototype, "hasID", {
	value: function(id) {
		return this.some(value => value?.id === id)
	}
})
Object.defineProperty(Array.prototype, "id", {
	value: function(id) {
		return this.find(value => value?.id === id)
	}
})

// Array populate
Object.defineProperty(Array.prototype, "populate", {
	value: populate
})

// Globally use custom string IDs
mongoose.plugin(schema => {
	if(schema.tree._id?.type == "ObjectId") {
		schema.add({
			_id: shortID
		})
	}
})

// Globally enable optimistic concurrency
mongoose.plugin(schema => {
	schema.set("optimisticConcurrency", true)
})

// Disable auto indexing
mongoose.set("autoIndex", false)

// Event listeners
const mongooseEvents = {
	beforeDelete: ["pre", /delete/, "query", ["deleteOne"]],
	beforeValidate: ["pre", /validate/],
	afterSave: ["post", /save|update/i],
	afterLoad: ["post", /find/]
}
mongoose.plugin(schema => {
	for(const callbackName in mongooseEvents) {
		const [hookType, eventPattern, listenerType, disabledOperations] = mongooseEvents[callbackName]
		const config = {
			query: listenerType == undefined || listenerType == "query",
			document: listenerType == undefined || listenerType == "document"
		}
		schema[hookType](eventPattern, config, async function() {
			if(!schema[callbackName]) return
			const documents = []
			if(this instanceof mongoose.Query) {
				if((disabledOperations || []).includes(this.op)) return
				const findQuery = this.model.find(this.getFilter())
				documents.push(...await findQuery)
			} else {
				documents.push(this)
			}
			for(const document of documents) {
				document.$locals.disabledListeners ||= {}
				logger.log(`Calling ${callbackName} for ${document.constructor.modelName} ${document.id}`)
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
		const modelName = this.constructor.modelName
		if(this.$locals.boundPermissionFunctions) {
			return this.$locals.boundPermissionFunctions
		}
		const PERMISSIONS = {}
		for(const permissionName in schema.permissions) {
			const permission = schema.permissions[permissionName]
			if(typeof permission != "function") continue
			const boundPermission = permission.bind(this)
			boundPermission.permissionSource = [modelName, this.id]
			PERMISSIONS[permissionName] = boundPermission
		}
		this.$locals.boundPermissionFunctions = PERMISSIONS
		return PERMISSIONS
	})
	schema.statics.PERMISSIONS = schema.permissions
})

// Mongoose better populate plugin
mongoose.plugin(schema => {
	schema.methods.populate = populate
	schema.method("populated", function(key) {
		const schemaDefinition = schema.tree[key]
		if(!schemaDefinition) throw Error(`Unknown populate path ${key}`)
		const arrayPopulate = schemaDefinition instanceof Array
		if(arrayPopulate) return this[key].every(i => isPopulated(i))
		else return isPopulated(this[key])
	}, {suppressWarning: true})
})

// Helper function to create a schema from a class
mongoose.Schema.fromClass = function(classInput) {
	const instance = new classInput()
	const properties = Object.getOwnPropertyNames(instance)
	const schemaDefinition = {}
	for(const property of properties) {
		let propertyDefinintion = instance[property]
		if(propertyDefinintion === undefined) continue

		if(property == "_id" && "_id" in schemaDefinition) throw Error("_id property already defined or derived")
		if(typeof propertyDefinintion == "object" && "deriveID" in propertyDefinintion) {
			if(propertyDefinintion["deriveID"] !== true) {
				throw Error("Invalid deriveID value")
			}
			if(!propertyDefinintion["ref"]) {
				throw Error("Cannot derive ID without ref")
			}
			schemaDefinition["_id"] = {
				type: String,
				default: function() {
					return this[property].id
				}
			}
		}

		const arrayDefinition = Array.isArray(propertyDefinintion)
		if(arrayDefinition) propertyDefinintion = propertyDefinintion[0]

		if(propertyDefinintion.toString().startsWith("class")) {
			propertyDefinintion = {
				type: mongoose.Schema.fromClass(propertyDefinintion),
				default: () => ({})
			}
		}

		schemaDefinition[property] = arrayDefinition ? [propertyDefinintion] : propertyDefinintion
	}
	
	const schema = new mongoose.Schema(schemaDefinition)
	schema.loadClass(classInput)
	return schema
}

// Refresh function
mongoose.plugin(schema => schema.methods.refresh = async function() {
	const newDocument = await this.constructor.findById(this.id)
	if(!newDocument) throw Error(`Document ${this.constructor.modelName} ${this.id} not found`)
	Object.assign(this, newDocument.toObject())
	logger.log("Refreshed document", this)
})

// Delete function (alias of deleteOne)
mongoose.plugin(schema => schema.methods.delete = async function() {
	if(schema.beforeDelete) await schema.beforeDelete.call(this)
	await this.deleteOne()
})

// Establish connection to database
export async function connect(dbName="main") {
	logger.log("Connecting...")
	try {
		await mongoose.connect(MONGO_URI, { dbName })
		
		logger.log("Connected!")
		return true
		
	} catch(error) {
		logger.log("Error:", error.message)
		throw error
	}
}

export async function clear() {
	logger.log("Clearing database...")
	await mongoose.connection.dropDatabase()
}

export const {setup} = await import("./setup.js")