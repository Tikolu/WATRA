import HTTPError from "modules/server/error.js"

import Event from "modules/schemas/event.js"
import Config from "modules/config.js"

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

	await event.setRole(user, RoleType.KOMENDANT)

	return {
		eventID: event.id
	}
}