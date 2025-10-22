import html from "modules/html.js"
import { RoleType } from "modules/types.js"

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
	
	// Load event invites
	if(await user.checkPermission(targetUnit.PERMISSIONS.MODIFY)) {
		await targetUnit.populate("eventInvites")
	}

	await user.checkPermission(targetUnit.PERMISSIONS.DELETE)
	await user.checkPermission(targetUnit.PERMISSIONS.MANAGE)
	
	return html("unit/page", {
		user,
		targetUnit
	})
}