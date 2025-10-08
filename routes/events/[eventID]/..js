import Event from "modules/schemas/event.js"
import HTTPError from "modules/server/error.js"

export async function open({user, eventID}) {
	// Get event from DB, and check if exists
	const targetEvent = await Event.findById(eventID)
	if(!targetEvent) throw new HTTPError(404, "Akcja nie istnieje")

	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.ACCESS, "Nie masz dostępu do tej akcji")

	this.addRouteData({targetEvent})
}