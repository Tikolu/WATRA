import html from "modules/html.js"

export default async function({user, targetUnit}) {
	// Check permission
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_EVENT)

	return html("unit/createEvent", {
		user,
		targetUnit
	})
}