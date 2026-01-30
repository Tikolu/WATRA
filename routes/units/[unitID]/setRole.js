import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)
	
	// Get all direct members
	const usersForAssignment = {}
	const directMembers = await targetUnit.getMembers()
	if(directMembers.length) usersForAssignment[""] = directMembers
	// Get all subMembers of subUnits
	await targetUnit.populate("subUnits")
	const requiredOrg = orgContext || targetUnit.org
	for(const unit of targetUnit.subUnits) {
		const subMembers = await Array.fromAsync(unit.getSubMembers())
		usersForAssignment[unit.displayName] = subMembers.filter(u => !requiredOrg || u.org == requiredOrg)
	}

	// Get user's role in unit, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetUnit)
	await targetUnit.populate("upperUnits")
	for await(const upperUnit of targetUnit.getUpperUnitsTree()) {
		if(await user.checkPermission(upperUnit.PERMISSIONS.SET_ROLE)) {
			userRole = null
			break
		}
	}
	
	// Create list of role options
	const roleOptions = []
	for(const roleID of targetUnit.config.roles) {
		// Skip roles higher than user's role
		const role = Config.roles[roleID]
		if(userRole && userRole.config.rank < role.rank) continue
		roleOptions.push(roleID)
	}
	
	return html("unit/setRole", {
		user,
		targetUnit,
		roleOptions,
		usersForAssignment,
		orgContext
	})
}