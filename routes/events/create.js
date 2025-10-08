import Event from "modules/schemas/event.js"
import html from "modules/html.js"

export default async function({user}) {
	// Check permission
	await user.requirePermission(Event.PERMISSIONS.CREATE)

	return html("event/create", {
		user
	})
}