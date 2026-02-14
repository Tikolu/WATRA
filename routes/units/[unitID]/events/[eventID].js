import html from "modules/html.js"
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

	this.addRouteData({targetEvent, targetInvitation})
}

export async function chooseParticipants({user, targetUnit, targetEvent, targetInvitation}) {
	// Check unit invitation state
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na akcję nie zostało zaakceptowane")

	// Generate graph
	const graph = await targetUnit.getGraph()

	return html("unit/chooseEventParticipants", {
		user,
		targetUnit,
		targetEvent,
		targetInvitation,
		graph
	})
}