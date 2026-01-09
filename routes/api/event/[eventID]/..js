import HTTPError from "modules/server/error.js"
import Event from "modules/schemas/event"

export async function _open({user, eventID}) {
	// Get event from DB, and check if exists
	const targetEvent = await Event.findById(eventID)
	if(!targetEvent) throw new HTTPError(404, "Akcja nie istnieje")

	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.ACCESS)

	this.addRouteData({targetEvent})
}