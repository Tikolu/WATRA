import html from "modules/html.js"

import HTTPError from "modules/server/error.js"
import Log from "modules/schemas/log.js"

export default async function({user, targetEvent, start, end, type}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.ACCESS_ACTIVITY)

	// Default values
	start ||= Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
	
	// Load logs
	const query = {
		$or: [
			{targetEvent: targetEvent.id}
		],
		_id: {
			$gte: Log.dateToID(start),
		}
	}
	if(end) query._id.$lte = Log.dateToID(end)
	
	if(type) {
		const typeEntry = Log.eventTypes[type]
		if(!typeEntry) throw new HTTPError(400, "Nieznany typ wydarzenia")
		query.eventType = typeEntry.pattern || type
	}
	const logs = await Log.find(query)

	await logs.populate(["user", "targetUsers", "targetEvent", "targetUnit", "targetForm"], {placeholders: false})

	return html("logs/list", {
		user,
		targetUnit: targetEvent,
		logs,
		start,
		end,
		directOnly: null,
		type,
		eventTypeFilter: type => Log.eventTypes[type].description.includes("$EVENT"),
		Log
	})
}