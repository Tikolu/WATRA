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
		"upperUnits"
	])
	await targetUnit.populate(
		{"roles": "user"},
		{select: ["name", "org"]}
	)
	
	// Sort roles
	await targetUnit.sortRoles()
	
	// Check all permissions
	await user.checkPermission(targetUnit.PERMISSIONS)

	// Load events for upcoming or ongoing events
	await targetUnit.populate("events", {
		filter: {"dates.end": {$gte: new Date()}},
		placeholders: false
	})

	// Load event invites for upcoming or ongoing events
	if(user.hasPermission(targetUnit.PERMISSIONS.MANAGE_INVITES)) {
		await targetUnit.populate("eventInvites", {
			filter: {"dates.end": {$gte: new Date()}},
			placeholders: false
		})
	}

	// Load subUnit events for upcoming or ongoing events
	let subUnitEvents = []
	if(user.hasPermission(targetUnit.PERMISSIONS.ACCESS_EVENTS)) {
		subUnitEvents.push(...await targetUnit.listEvents(true).toArray())
		// Remove duplicates
		subUnitEvents = subUnitEvents.unique("id")
		// Sort by date
		subUnitEvents.sort((a, b) => {
			const aDate = a.dates.start || 0
			const bDate = b.dates.start || 0
			return aDate - bDate
		})
		// Load upperUnits
		await subUnitEvents.populate("upperUnits")
	}

	// Load forms
	await targetUnit.loadFormsForUser(user)
	
	return html("unit/page", {
		user,
		targetUnit,
		orgContext,
		subUnitEvents
	})
}