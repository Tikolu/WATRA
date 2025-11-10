import html from "modules/html.js"
import Config from "modules/config.js"
import Unit from "modules/schemas/unit"

export default async function({user, targetEvent}) {
	const topUnits = await Unit.find({"type": Config.event.topUnitTypes})
	const units = {}

	function saveUnit(unit) {
		// Find units of highest type
		if(topUnits && topUnits[0].type === unit.type) {
			topUnits.push(unit)
		} else if(!topUnits || topUnits[0].type < unit.type) {
			topUnits = [unit]
		}
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