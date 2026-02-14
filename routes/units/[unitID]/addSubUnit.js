import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	orgContext ||= targetUnit.org 
	
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ADD_SUBUNIT)
	
	// Get subUnits
	const subUnitsTree = targetUnit.traverse("subUnits")
	
	// Find units that can be linked as subUnits
	const unitsForLinking = []
	await user.populate("roles")
	for(const role of user.roles) {
		if(!role.hasTag("manageSubUnit")) continue
		await role.populate("unit")
		for await(const unit of role.unit.traverse("subUnits")) {
			// Skip units at their upperUnit limit
			if(unit.upperUnits.length >= unit.config.maxUpperUnits) continue
			// Skip units of higher or equal rank
			if(unit.config.rank >= targetUnit.config.rank) continue
			// Skip units which already are subUnits
			if(await subUnitsTree.some(u => u.id == unit.id)) continue
			if(unitsForLinking.hasID(unit.id)) continue

			await unit.populate("upperUnits")
			unitsForLinking.push(unit)
		}
	}

	// Find org types
	const orgs = [{value: null, name: ""}]
	for(const orgID in Config.orgs) {
		orgs.push({value: orgID, name: Config.orgs[orgID].name})
	}

	// Find unit types
	const subUnitTypes = targetUnit.getSubUnitOptions()

	// Find unique departments
	const departmentOptions = subUnitTypes.unique("department", true).map(departmentID =>
		({value: departmentID, name: Config.departments[departmentID]?.name})
	)

	return html("unit/addSubUnit", {
		user,
		targetUnit,
		unitsForLinking,
		orgContext,
		orgs,
		subUnitTypes,
		departmentOptions
	})
}