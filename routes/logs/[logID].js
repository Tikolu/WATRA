import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import Log from "modules/schemas/log.js"

export function _open() {
	if(!this.session.ensureActiveUser(this)) return
}

export default async function({user, logID}) {
	// Get log from DB, and check if exists
	const targetLog = await Log.findById(logID)
	if(!targetLog) throw new HTTPError(404, "Log nie istnieje")

	await user.requirePermission(targetLog.PERMISSIONS.ACCESS, "Nie masz dostępu do tego logu")

	return html("logs/log", {
		targetLog
	})
}