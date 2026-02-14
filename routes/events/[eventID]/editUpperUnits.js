import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	// Generate graph
	const graph = await user.getGraph({
		userFilter: false,
		roleFilter: (unit, role) => role.hasTag("manageEvent"),
		unitFilter: unit => unit.config.eventRules.create || unit.subUnits.length
	})
	
	return html("event/editUpperUnits", {
		targetEvent,
		graph
	})
}