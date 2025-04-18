import sleep from "modules/sleep.js"
import HTTPError from "modules/server/error.js"

export default async function * ({user}) {
	if(!user) throw new HTTPError(403)
	
	let count = 0

	while(true) {
		count += 1
		yield count + "\n"
		await sleep(250)
	}
}