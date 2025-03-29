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
				console.log(`Calling ${callbackName} for ${document.constructor.modelName} ${document.id}`)
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
	schema.methods.populate = async function(...path) {
		this.$locals.populated ||= []
		
		let currentKeys = path.shift()
		if(!(currentKeys instanceof Array)) currentKeys = [currentKeys]

		for(const key of currentKeys) {
			if(typeof key != "string") throw Error("Invalid populate path")
			if(
				!this.populated(key) && this[key] &&
				(!(this[key] instanceof Array) || this[key].length > 0)
			) {
				let schemaDefinition = schema.tree[key]
				if(!schemaDefinition) throw Error(`Unknown populate path ${key}`)
				const arrayPopulate = schemaDefinition instanceof Array
				if(arrayPopulate) schemaDefinition = schemaDefinition[0]
			
				let ref = schemaDefinition.ref
				if(typeof ref == "function") {
					ref = await ref.call(this)
				} else if(typeof ref != "string") {
					throw Error(`Path ${key} cannot be populated, invalid ref`)
				}
				if(!ref) throw Error(`Path ${key} cannot be populated, no ref defined`)

				const Model = mongoose.model(ref)
			
				const results = await Model.find(
					{ _id: this[key] }
				)
				this[key] = arrayPopulate ? results : results[0]
				this.$locals.populated.push(key)
			}
			if(path.length) {
				if(this[key] instanceof Array) {
					for(const item of this[key]) {
						await item.populate(...path)
					}
				} else if(this[key]) {
					await this[key].populate(...path)
				}
			}
		}

	}
	schema.methods.populated = function(key) {
		this.$locals.populated ||= []
		return this.$locals.populated.includes(key)
	}
})

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
