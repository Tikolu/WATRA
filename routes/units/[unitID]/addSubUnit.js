import html from "modules/html.js"
import { FunkcjaType, UnitType } from "modules/types.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get subUnits
	const subUnitsTree = await Array.fromAsync(targetUnit.getSubUnitsTree())
	
	// Find units that can be linked as subUnits
	const unitsForLinking = []
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue
		await funkcja.populate("unit")
		for await(const unit of funkcja.unit.getSubUnitsTree()) {
			// Skip units of higher type
			if(unit.type >= targetUnit.type) continue
			// Skip units which already are subUnits
			if(subUnitsTree.hasID(unit.id)) continue
			if(unitsForLinking.hasID(unit.id)) continue

			await unit.populate("upperUnits")
			unitsForLinking.push(unit)
		}
	}

	// Find units types for creating new subUnit
	const subUnitsTypes = []
	for(const [typeName, type] of Object.entries(UnitType)) {
		if(type >= targetUnit.type) continue
		subUnitsTypes.unshift({name: typeName, value: type})
	}
	
	return html("unit/addSubUnit", {
		user,
		targetUnit,
		unitsForLinking,
		subUnitsTypes
	})
}