import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)
	
	// Sort roles
	await targetUnit.sortRoles(false)
	
	// Get all direct members
	const usersForAssignment = {}
	const directMembers = await targetUnit.getMembers()
	if(directMembers.length) usersForAssignment[""] = directMembers
	// Get all subMembers of subUnits
	await targetUnit.populate("subUnits")
	for(const unit of targetUnit.subUnits) {
		const subMembers = await Array.fromAsync(unit.getSubMembers())
		usersForAssignment[unit.displayName] = subMembers
	}
	
	return html("unit/setRole", {
		user,
		targetUnit,
		usersForAssignment,
		orgContext
	})
}