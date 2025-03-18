globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

import * as server from "modules/server"
import * as database from "modules/database"

await database.connect(true)

if(Deno.args[0] == "--clear-database") {
	await database.clear()
	Deno.exit()
}

await database.setup()

server.start("127.0.0.1", 3001)

globalThis.addEventListener("unhandledrejection", event => {
	event.preventDefault()
	console.log("\n\x1b[91m[Critical]\x1b[0m UNHANDLED REJECTION!")
	console.error(event.reason)
})