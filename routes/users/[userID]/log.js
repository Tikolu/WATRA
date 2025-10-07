import html from "modules/html.js"

import HTTPError from "modules/server/error.js"
import Log from "modules/schemas/log.js"

export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)

	const logs = await Log.find({
		$or: [
			{user: targetUser.id},
			{targetUser: targetUser.id}
		]
	})

	await logs.populate(["targetUser", "targetWyjazd", "targetUnit"])

	return html("user/log", {
		user,
		targetUser,
		logs
	})
}