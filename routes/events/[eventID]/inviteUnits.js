import html from "modules/html.js"
import Config from "modules/config.js"
import Unit from "modules/schemas/unit"
import Graph from "modules/schemas/unit/graph.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	// Get top unit
	const units = await targetEvent.traverse("upperUnits").toArray()
	const topUnit = units.at(-1)

	// Generate graph
	const graph = await topUnit?.getGraph({
		userFilter: false,
		unitFilter: unit => unit.config.eventRules.invite || unit.subUnits.length,
		subUnitFilter: unit => targetEvent.invitedUnits.find(i => i.unit.id == unit.id)
	}) || new Graph()

	return html("event/inviteUnits", {
		user,
		targetEvent,
		graph
	})
}