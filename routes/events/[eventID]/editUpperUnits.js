import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	await targetEvent.populate("upperUnits")
	for(const unit of targetEvent.upperUnits) {
		if(!await user.checkPermission(unit.PERMISSIONS.CREATE_EVENT)) {
			throw new HTTPError(403)
		}
	}
	
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