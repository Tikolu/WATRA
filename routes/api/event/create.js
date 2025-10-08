import HTTPError from "modules/server/error.js"

import Event from "modules/schemas/event.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, name, startDate, endDate}) {
	if(!user) throw new HTTPError(403)
	await user.requirePermission(Event.PERMISSIONS.CREATE)
	
	const event = new Event({
		name,
		dates: {
			start: startDate,
			end: endDate
		}
	})

	await event.setFunkcja(user, FunkcjaType.KOMENDANT)

	return {
		eventID: event.id
	}
}