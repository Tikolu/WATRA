import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ADD_SUBUNIT)
	
	// Get subUnits
	const subUnitsTree = await Array.fromAsync(targetUnit.getSubUnitsTree())
	
	// Find units that can be linked as subUnits
	const unitsForLinking = []
	await user.populate("roles")
	for(const role of user.roles) {
		await role.populate("unit")
		if(!await user.checkPermission(role.unit.PERMISSIONS.EDIT)) continue
		for await(const unit of role.unit.getSubUnitsTree()) {
			// Skip units of higher or equal rank
			if(unit.config.rank >= targetUnit.config.rank) continue
			// Skip units which already are subUnits
			if(subUnitsTree.hasID(unit.id)) continue
			if(unitsForLinking.hasID(unit.id)) continue

			await unit.populate("upperUnits")
			unitsForLinking.push(unit)
		}
	}

	// Find unit types for creating new subUnit
	const subUnitTypes = targetUnit.getSubUnitOptions()

	// Find unique departments
	const departmentOptions = subUnitTypes.unique("department", true).map(departmentID =>
		({value: departmentID, name: Config.departments[departmentID]?.name})
	)

	return html("unit/addSubUnit", {
		user,
		targetUnit,
		unitsForLinking,
		subUnitTypes,
		departmentOptions
	})
}