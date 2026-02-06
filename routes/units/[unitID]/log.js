import html from "modules/html.js"

import HTTPError from "modules/server/error.js"
import Log from "modules/schemas/log.js"

export default async function({user, targetUnit, start, end, direct, type}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_ACTIVITY)

	// Default values
	start ||= Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
	end ||= Date.now()
	const directOnly = direct == "true"

	// Load unit members
	const members = await Array.fromAsync(targetUnit.getSubMembers())
	// Load logs
	const query = {
		$or: [
			{targetUnit: targetUnit.id}
		],
		_id: {
			$gte: Log.dateToID(start),
			$lte: Log.dateToID(end)
		}
	}
	if(!directOnly) {
		const memberIDs = members.map(m => m.id)
		query.$or.push(
			{user: {$in: memberIDs}},
			{targetUser: {$in: memberIDs}}
		)
	}
	if(type) {
		const typeEntry = Log.eventTypes[type]
		if(!typeEntry) throw new HTTPError(400, "Nieznany typ wydarzenia")
		query.eventType = typeEntry.pattern || type
	}
	const logs = await Log.find(query)

	await logs.populate(["user", "targetUser", "targetEvent", "targetUnit"], {placeholders: false})

	return html("logs/list", {
		user,
		targetUnit,
		logs,
		start,
		end,
		directOnly,
		type,
		Log
	})
}