import html from "modules/html.js"

export default async function({user, targetUnit}) {
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_MEMBERS)
	
	// Load all events
	await targetUnit.populate("events")

	// Load all event invites
	if(await user.checkPermission(targetUnit.PERMISSIONS.MANAGE_INVITES)) {
		await targetUnit.populate("eventInvites")
	}

	// Load all subUnit events
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

	return html("unit/eventList", {
		user,
		targetUnit,
		subUnitEvents
	})
}