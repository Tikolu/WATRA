import html from "modules/html.js"

export default async function({user, targetUnit}) {
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_EVENTS)
	
	// Load all events
	await targetUnit.populate("events")

	// Load all event invites
	await targetUnit.populate("eventInvites")

	// Load all subUnit events
	const subUnitEvents = []
	subUnitEvents.push(...await targetUnit.listEvents().toArray())
	// Sort by date
	subUnitEvents.sort((a, b) => {
		const aDate = a.dates.start || 0
		const bDate = b.dates.start || 0
		return aDate - bDate
	})

	return html("unit/eventList", {
		user,
		targetUnit,
		subUnitEvents
	})
}