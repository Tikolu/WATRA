import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit}) {
	// Populate unit roles, as well as users and units of roles
	await targetUnit.populate({
		"roles": ["user", "unit"]
	})
	// Populate sub and upper units
	await targetUnit.populate([
		"subUnits",
		"upperUnits"
	])
	
	// Sort roles
	await targetUnit.sortRoles()
	
	// Check all permissions
	await user.checkPermission(targetUnit.PERMISSIONS)

	// Load event invites
	if(user.hasPermission(targetUnit.PERMISSIONS.MANAGE_INVITES)) {
		await targetUnit.populate("eventInvites")
	}
	
	return html("unit/page", {
		user,
		targetUnit
	})
}