import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	return html("event/addDocument", {
		user,
		targetEvent
	})
}