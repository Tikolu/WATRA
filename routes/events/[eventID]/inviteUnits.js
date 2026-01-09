import html from "modules/html.js"
import Config from "modules/config.js"
import Unit from "modules/schemas/unit"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	let topUnits = await Unit.find({"type": Config.event.topUnitTypes})
	const units = {}

	if(!topUnits.length) {
		await targetEvent.populate("upperUnits")
		topUnits = targetEvent.upperUnits
	}

	for(const topUnit of topUnits) {	
		const subUnits = topUnit.getSubUnitsTree()
		for await(const unit of subUnits) units[unit.id] = unit
	}

	return html("event/inviteUnits", {
		user,
		targetEvent,
		topUnits,
		units,
	})
}