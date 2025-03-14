import mongoose from "npm:mongoose"

import shortID from "modules/database/shortID.js"

const MONGO_URI = "mongodb://localhost:27017/main"
const MONGO_OPTIONS = {}

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
	beforeDelete: ["pre", /delete/],
	beforeValidate: ["pre", /validate/],
	afterSave: ["post", /save|update/i]
}
mongoose.plugin(schema => {
	for(const callbackName in mongooseEvents) {
		const [hookType, eventPattern] = mongooseEvents[callbackName]
		schema[hookType](eventPattern, {query: true, document: true}, async function() {
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
				if(document.$locals.disabledListeners[callbackName]) continue
				document.$locals.disabledListeners[callbackName] = true
				await schema[callbackName].call(document)
				document.$locals.disabledListeners[callbackName] = false
			}
		})
	}
})


export async function connect(verbose=false) {
	console.log("\x1b[32m[MongoDB]\x1b[0m Connecting...")
	try {
		await mongoose.connect(MONGO_URI, MONGO_OPTIONS)
		
		if(verbose) console.log("\x1b[32m[MongoDB]\x1b[0m Connected!")
		return true
		
	} catch(error) {
		console.log("\x1b[32m[MongoDB]\x1b[0m Error:", error.message)
		throw error
	}
}

export async function setup() {
	const {default: User} = await import("modules/schemas/user.js")
	const {default: Jednostka, JednostkaType} = await import("modules/schemas/jednostka.js")

	const user = await User.findOne()
	const jednostka = await Jednostka.findOne()

	if(!user && !jednostka) {
		const { FunkcjaType } = await import("modules/schemas/funkcja.js")
		
		const newUser = new User()
		const newJednostka = new Jednostka({
			type: JednostkaType.HUFIEC
		})

		await newJednostka.setFunkcja(newUser, FunkcjaType.DRUŻYNOWY)
		console.log("Test user access code:", await newUser.generateAccessCode())
	}
}

export async function clear() {
	console.log("\x1b[32m[MongoDB]\x1b[0m Clearing database...")
	await mongoose.connection.dropDatabase()
}
