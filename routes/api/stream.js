import HTTPError from "modules/server/error.js"
import sleep from "modules/sleep.js"

import mongoose from "mongoose"

const eventEmitter = mongoose.connection.db.watch()

let resolve = () => {}
function promiseSetup() {
	eventEmitter.promise = new Promise(r => resolve = r)
}
promiseSetup()

eventEmitter.addListener("change", event => {
	resolve(event)
	promiseSetup()
})

export default async function * ({user}) {
	if(!user) throw new HTTPError(403)

	while(true) {
		// Wait for database update, or 10 seconds
		const result = await Promise.any([
			eventEmitter.promise,
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
					type: result.ns.coll,
					id: result.documentKey._id
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