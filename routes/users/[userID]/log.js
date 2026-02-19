import html from "modules/html.js"

import HTTPError from "modules/server/error.js"
import Log from "modules/schemas/log.js"

export default async function({user, targetUser, start, end, direct, type}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ACCESS_ACTIVITY)

	// Default values
	start ||= Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
	end ||= Date.now()
	const directOnly = direct == "true"

	// Load logs
	const query = {
		$or: [
			{targetUser: targetUser.id}
		],
		_id: {
			$gte: Log.dateToID(start),
			$lte: Log.dateToID(end)
		}
	}
	if(!directOnly) query.$or.push(
		{user: targetUser.id},
		{"data.userIDs": targetUser.id}
	)
	if(type) {
		const typeEntry = Log.eventTypes[type]
		if(!typeEntry) throw new HTTPError(400, "Nieznany typ wydarzenia")
		query.eventType = typeEntry.pattern || type
	}

	const logs = await Log.find(query)

	await logs.populate(["user", "targetUser", "targetEvent", "targetUnit", "targetForm"], {placeholders: false})

	return html("logs/list", {
		user,
		targetUser,
		logs,
		start,
		end,
		directOnly,
		type,
		Log
	})
}