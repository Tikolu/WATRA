import html from "modules/html.js"

import HTTPError from "modules/server/error.js"
import Log from "modules/schemas/log.js"

export default async function({user, targetUnit, start, end, direct, type}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_ACTIVITY)

	// Default values
	start ||= Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
	const directOnly = direct == "true"
	
	// Load logs
	const query = {
		$or: [
			{targetUnit: targetUnit.id}
		],
		_id: {
			$gte: Log.dateToID(start),
		}
	}
	if(end) query._id.$lte = Log.dateToID(end)
	
	if(!directOnly) {
		// Load unit members, archived members and parents
		const members = new Set()
		for await(const unit of targetUnit.traverse("subUnits", {includeSelf: true})) {
			await unit.populate({
				"roles": "user",
				"archivedUsers": {}
			})
			for(const u of [...unit.roles.map(r => r.user), ...unit.archivedUsers]) {
				members.add(u.id)
				for(const parent of u.parents || []) {
					members.add(parent.id)
				}
			}
		}

		query.$or.push(
			{user: {$in: [...members]}},
			{targetUser: {$in: [...members]}}
		)
	}
	if(type) {
		const typeEntry = Log.eventTypes[type]
		if(!typeEntry) throw new HTTPError(400, "Nieznany typ wydarzenia")
		query.eventType = typeEntry.pattern || type
	}
	const logs = await Log.find(query)

	await logs.populate(["user", "targetUser", "targetEvent", "targetUnit", "targetForm"], {placeholders: false})

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