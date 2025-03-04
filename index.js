globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

import * as server from "modules/server"
import * as database from "modules/database"

await database.connect(true)
server.start("127.0.0.1", 3001)