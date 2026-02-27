import html from "modules/html.js"
import Config from "modules/config.js"
import Unit from "modules/schemas/unit"
import UnitTree from "modules/schemas/unit/tree.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	// Check event details
	if(targetEvent.missingDetails.length > 0) {
		throw new HTTPError(400, "Uzupełnij szczegóły akcji, aby zaprosić jednostki")
	}
	
	// Get top unit
	const units = await targetEvent.traverse("upperUnits").toArray()
	const topUnit = units.at(-1)

	// Get event org
	const eventOrg = await targetEvent.getOrg()

	// Generate tree
	const tree = await topUnit?.getTree({
		userFilter: false,
		unitFilter: unit => {
			// Skip units in different org
			if(eventOrg && unit.org && unit.org != eventOrg) return false
			// Skip units which cannot be invited
			return unit.config.eventRules.invite || unit.subUnits.length
		},
		subUnitFilter: unit => targetEvent.invitedUnits.find(i => i.unit.id == unit.id)
	}) || new UnitTree()

	return html("event/inviteUnits", {
		user,
		targetEvent,
		tree
	})
}