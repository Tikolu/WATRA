// Set up globals for root directory and startup time
globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

import * as server from "modules/server"
import * as database from "modules/database"
import * as cli from "jsr:@std/cli"

// Parse command line arguments
const args = cli.parseArgs(Deno.args, {
	boolean: ["clear-database"],
	string: ["host", "port", "db"]
})

// Connect to database
await database.connect(args.db)

// Clear database functionality
if(args["clear-database"]) {
	await database.clear()
	Deno.exit()
}

// Setup database ()
await database.setup()

// Start server
server.start(args.host, args.port)

// Handle errors in async functions used without await
globalThis.addEventListener("unhandledrejection", event => {
	event.preventDefault()
	console.log("\n\x1b[91m[Critical]\x1b[0m UNHANDLED REJECTION!")
	console.error(event.reason)
})