// Set up globals for root directory and startup time
globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

globalThis.MIN_DATE = "1800-01-01"
globalThis.MAX_DATE = (new Date().getFullYear() + 100) + "-01-01"

import * as server from "modules/server"
import * as cli from "cli"
import "modules/util.js"
import { Logger } from "modules/logger.js"

// Parse command line arguments
const args = cli.parseArgs(Deno.args, {
	boolean: ["clear-database", "development"],
	string: ["host", "port", "db"]
})

if(!args.db) {
	console.log("Database name is required (--db)")
	Deno.exit(1)
}

// Setup database ()
const databaseSetupPromise = (async () => {
	const database = await import("modules/database")
	
	// Connect to database
	await database.connect(args.db)

	// Clear database functionality
	if(args["clear-database"]) {
		await database.clear()
		Deno.exit(1)
	}

	// Data import functionality
	if(args["import-data"]) {
		await data.setup(args["import-data"])
		Deno.exit(1)
	}
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
const logger = new Logger("Critical", 91)
globalThis.addEventListener("unhandledrejection", event => {
	event.preventDefault()
	logger.log("UNHANDLED REJECTION!")
	console.error(event.reason)
})