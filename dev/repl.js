Deno.args.push("--db", prompt("Database name:"))
Deno.args.push("--repl")
await import("index")

const {ready: databaseReady} = await import("modules/database/index.js")
await databaseReady

const {default: User} = await import("modules/schemas/user")
const {default: Unit} = await import("modules/schemas/unit")
const {default: Event} = await import("modules/schemas/event")
const {default: Role} = await import("modules/schemas/role.js")
const {default: Passkey} = await import("modules/schemas/passkey.js")
const {default: Form} = await import("modules/schemas/form")
const {default: FormResponse} = await import("modules/schemas/form/response.js")
const {default: Log} = await import("modules/schemas/log.js")