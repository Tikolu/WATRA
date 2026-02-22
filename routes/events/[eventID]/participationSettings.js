import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	return html("event/participationSettings", {
		user,
		targetEvent
	})
}