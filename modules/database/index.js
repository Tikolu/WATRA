import mongoose from "npm:mongoose"

const MONGO_URI = "mongodb://localhost:27017/main"
const MONGO_OPTIONS = {}

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
	
}