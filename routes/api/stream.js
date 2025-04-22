import HTTPError from "modules/server/error.js"

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
		const dbUpdate = await eventEmitter.promise
		const data = {
			type: dbUpdate.ns.coll,
			id: dbUpdate.documentKey._id
		}

		// console.log("Sending update event:", data)
		yield {
			event: "update",
			data
		}
	}
}