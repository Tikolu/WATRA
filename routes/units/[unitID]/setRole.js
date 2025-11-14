import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)
	
	// Sort roles
	await targetUnit.sortRoles(false)
	
	// All members can be assigned, excluding the user
	const usersForAssignment = await targetUnit.getMembers([user.id])
	
	return html("unit/setRole", {
		user,
		targetUnit,
		usersForAssignment,
		orgContext
	})
}