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

	// Get event org
	const eventOrg = await targetEvent.getOrg()

	// Generate graph
	const graph = await topUnit?.getGraph({
		userFilter: false,
		unitFilter: unit => {
			// Skip units in different org
			if(eventOrg && unit.org && unit.org != eventOrg) return false
			// Skip units which cannot be invited
			return unit.config.eventRules.invite || unit.subUnits.length
		},
		subUnitFilter: unit => targetEvent.invitedUnits.find(i => i.unit.id == unit.id)
	}) || new Graph()

	return html("event/inviteUnits", {
		user,
		targetEvent,
		graph
	})
}