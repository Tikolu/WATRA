import mongoose from "mongoose"

import shortID from "modules/database/shortID.js"
import { populate, isPopulated } from "modules/database/populate.js"

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

// Array populate
Object.defineProperty(Array.prototype, "populate", {
	value: populate
})

// Globally use custom string IDs
mongoose.plugin(schema => {
	if(schema.tree._id.default) return
	schema.add({
		_id: shortID
	})
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
		schema.permissions._modelName = this.constructor.modelName
		if(this.$locals.boundPermissionFunctions) {
			return this.$locals.boundPermissionFunctions
		}
		const PERMISSIONS = {}
		for(const permissionName in schema.permissions) {
			const permission = schema.permissions[permissionName]
			if(typeof permission != "function") continue
			const boundPermission = permission.bind(this)
			boundPermission.permissionSource = [schema.permissions._modelName, this.id]
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
	console.log("\x1b[32m[MongoDB]\x1b[0m Refreshed document", this)
})

// Delete function (alias of deleteOne)
mongoose.plugin(schema => schema.methods.delete = async function() {
	if(schema.beforeDelete) await schema.beforeDelete.call(this)
	await this.deleteOne()
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
