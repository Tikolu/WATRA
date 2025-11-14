import html from "modules/html.js"
import Config from "modules/config.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetUnit, orgContext}) {
	
	await targetUnit.populate([
		"roles",
		"subUnits",
		"upperUnits",
		"events"
	])
	await targetUnit.populate(
		{"roles": "user"},
		{select: ["name", "org"]}
	)
	
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
		targetUnit,
		orgContext
	})
}