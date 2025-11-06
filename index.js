// Set up globals for root directory and startup time
globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

globalThis.MIN_DATE = "1800-01-01"
globalThis.MAX_DATE = (new Date().getFullYear() + 100) + "-01-01"

import * as server from "modules/server"
import * as cli from "jsr:@std/cli"
import "modules/util.js"

// Parse command line arguments
const args = cli.parseArgs(Deno.args, {
	boolean: ["clear-database", "development"],
	string: ["host", "port", "db"]
})

// Setup database ()
const databaseSetupPromise = (async () => {
	const database = await import("modules/database")
	
	// Connect to database
	await database.connect(args.db)

	// Clear database functionality
	if(args["clear-database"]) {
		await database.clear()
		Deno.exit()
	}

	await database.setup()
})()


// Start server
server.start({
	host: args.host,
	port: args.port,
	dev: args["development"],
	async beforeRequest() {
		await databaseSetupPromise
	}
})

// Handle errors in async functions used without await
globalThis.addEventListener("unhandledrejection", event => {
	event.preventDefault()
	console.log("\n\x1b[91m[Critical]\x1b[0m UNHANDLED REJECTION!")
	console.error(event.reason)
})