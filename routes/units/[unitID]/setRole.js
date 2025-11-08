import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)
	
	// All members can be assigned, excluding the user
	const usersForAssignment = await targetUnit.getMembers([user.id])
	
	return html("unit/setRole", {
		user,
		targetUnit,
		usersForAssignment
	})
}