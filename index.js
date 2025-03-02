import "./import_map.json" with {type: "json"}

globalThis.SERVER_ROOT = import.meta.url.replace("index.js", "")
globalThis.SERVER_TIME = new Date()

import * as server from "modules/server"

const { connect: mongoConnect } = await import("modules/database")

await mongoConnect(true)

server.start("127.0.0.1", 3001)