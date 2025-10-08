import HTTPError from "modules/server/error.js"
import Event from "modules/schemas/event.js"

export async function open({user, targetUnit, eventID}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get event from DB, and check if exists
	const targetEvent = await Event.findById(eventID)
	if(!targetEvent) throw new HTTPError(404, "Akcja nie istnieje")
	
	// Check unit invitation state
	const targetInvitation = targetEvent.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) throw new HTTPError("Jednostka nie jest zaproszona na akcję")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na akcję nie zostało zaakceptowane")


	this.addRouteData({targetEvent, targetInvitation})
}