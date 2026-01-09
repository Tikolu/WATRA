import html from "modules/html.js"
import Config from "modules/config.js"
import HTTPError from "modules/server/error.js"

import Unit from "modules/schemas/unit"

export async function _open({user, unitID, org: orgContext}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Ensure org exists
	if(orgContext && !Config.orgs[orgContext]) {
		throw new HTTPError(404, "Organizacja nie istnieje")
	}

	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS, "Nie masz dostępu do tej jednostki")

	this.addRouteData({targetUnit, orgContext})
}

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