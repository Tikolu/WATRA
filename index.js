globalThis.VERSION = "2.1.0"

// Set up globals for root directory and startup time
globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

import * as server from "modules/server"
import * as database from "modules/database"
import * as cli from "cli"
import "modules/util.js"
import { Logger } from "modules/logger.js"

// Handle errors in async functions used without await
const logger = new Logger("Critical", 91)
globalThis.addEventListener("unhandledrejection", event => {
	event.preventDefault()
	logger.log("UNHANDLED REJECTION!")
	console.error(event.reason)
})

// Parse command line arguments
const args = cli.parseArgs(Deno.args, {
	boolean: ["clear-database", "development"],
	string: ["import", "host", "port", "db", "script"]
})

if(!args.db) {
	console.log("Database name is required (--db)")
	Deno.exit(1)
}

database.connect(args.db)

database.ready.then(async () => {
	// Clear database functionality
	if(args["clear-database"]) {
		await database.clear()
	}

	// Data import functionality
	if(args.import) {
		await database.setup(args.import)
	}

	// Run custom script
	if(args["script"]) {
		console.log(`Running custom script: ${args["script"]}`)
		await import(`./${args["script"]}`)
	}

	// Exit
	if(!args.host || !args.port) {
		console.log("Provide --host and --port to start server")
		Deno.exit()
	}
})

// Start server
if(args.host && args.port) {
	server.start({
		host: args.host,
		port: args.port,
		dev: args["development"],
		async beforeRequest() {
			await database.ready
		}
	})
}