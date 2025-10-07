import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	// await targetWyjazd.populate({"funkcje": ["user", "unit"]})

	const units = {}
	let topUnits

	function saveUnit(unit) {
		units[unit.id] = unit
		// Find units of highest type
		if(topUnits && topUnits[0].type === unit.type) {
			topUnits.push(unit)
		} else if(!topUnits || topUnits[0].type < unit.type) {
			topUnits = [unit]
		}
	}
	
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.PRZYBOCZNY) continue
		await funkcja.populate({"unit": {"funkcje": "user"}})
		const unit = funkcja.unit
		saveUnit(unit)

		const upperUnits = unit.getUpperUnitsTree(Object.keys(units))
		for await(const upperUnit of upperUnits) saveUnit(upperUnit)
	}

	for(const topUnit of topUnits) {	
		const subUnits = topUnit.getSubUnitsTree()
		for await(const subUnit of subUnits) saveUnit(subUnit)
	}
	
	topUnits = topUnits.map(unit => unit.id)

	return html("wyjazd/inviteUnits", {
		user,
		units,
		topUnits,
		targetWyjazd
	})
}