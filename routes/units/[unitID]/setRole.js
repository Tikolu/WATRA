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

	// Get user's role in unit
	const userRole = await user.getRoleInUnit(targetUnit)
	
	return html("unit/setRole", {
		user,
		targetUnit,
		userRole,
		usersForAssignment,
		orgContext
	})
}