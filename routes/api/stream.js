import mongoose from "mongoose"

import HTTPError from "modules/server/error.js"
import sleep from "modules/sleep.js"

const watcher = {
	emitter: null,
	async: Promise.withResolvers()
}

// Check topology type to determine if change streams are supported
const dbTopology = mongoose.connection.db.client.topology.description.type
if(dbTopology != "Single") {
	watcher.emitter = mongoose.connection.db.watch()
	watcher.emitter?.addListener("change", event => {
		watcher.async.resolve(event)
		watcher.async = Promise.withResolvers()
	})
}

export default async function * ({user}) {
	if(!user) throw new HTTPError(403)

	while(true) {
		// Wait for database update, or 10 seconds
		const result = await Promise.any([
			watcher.async.promise,
			sleep(10000)
		])

		// Check if session has timed out
		if(this.session.timedOut) {
			throw new HTTPError(403)
		}

		// Send update event
		if(result) {
			yield {
				event: "update",
				data: {
					type: result.ns?.coll,
					id: result.documentKey?._id
				}
			}
			continue

		// Otherwise send ping
		} else {
			yield {
				event: "ping"
			}
		}
	}
}