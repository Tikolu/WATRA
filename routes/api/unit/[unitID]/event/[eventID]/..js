import HTTPError from "modules/server/error.js"
import Event from "modules/schemas/event"

export async function _open({user, targetUnit, eventID}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_INVITES)
	
	// Get event from DB, and check if exists
	const targetEvent = await Event.findById(eventID)
	if(!targetEvent) throw new HTTPError(404, "Akcja nie istnieje")
	
	// Check if unit is invited
	const targetInvitation = targetEvent.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) {
		throw new HTTPError(400, "Jednostka nie jest zaproszona na akcję")
	}

	// Ensure event has not started
	if(targetEvent.isPast) throw new HTTPError(400, "Akcja już się odbyła")

	this.addRouteData({targetEvent, targetInvitation})
}