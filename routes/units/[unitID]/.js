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

	// Load subUnit events
	const subUnitEvents = []
	if(await user.hasRoleInUnits("manageEvent", targetUnit)) {
		subUnitEvents.push(...await Array.fromAsync(targetUnit.getSubUnitEvents()))
		// Sort by date
		subUnitEvents.sort((a, b) => {
			const aDate = a.dates.start || 0
			const bDate = b.dates.start || 0
			return aDate - bDate
		})
	}
	
	return html("unit/page", {
		user,
		targetUnit,
		orgContext,
		subUnitEvents
	})
}