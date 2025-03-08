import mongoose from "npm:mongoose"

import shortID from "modules/database/shortID.js"

const MONGO_URI = "mongodb://localhost:27017/main"
const MONGO_OPTIONS = {}

String.prototype.__defineGetter__("id", function() {
	if(!shortID.validate.test(this)) return undefined
	else return this
})
Array.prototype.hasID = function hasID(id) {
	return this.some(value => value?.id === id)
}

mongoose.plugin(schema => {
	schema.add({
		_id: shortID
	})
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
	const {default: Jednostka} = await import("modules/schemas/jednostka.js")

	const user = await User.findOne()
	const jednostka = await Jednostka.findOne()

	if(!user && !jednostka) {
		const newUser = new User()
		const newJednostka = new Jednostka()

		console.log("Test user access code:", await newUser.generateAccessCode())
		await newJednostka.addMember(newUser)
	}
}