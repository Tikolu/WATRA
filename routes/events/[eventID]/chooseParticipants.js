import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import Unit from "modules/schemas/unit"

export default async function({user, targetEvent, unit: unitID}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Check unit invitation state
	const targetInvitation = targetEvent.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) throw new HTTPError("Jednostka nie jest zaproszona na akcję")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na akcję nie zostało zaakceptowane")

	this.addRouteData({targetUnit, targetInvitation})
	
	const availableMembers = await Array.fromAsync(targetUnit.getSubMembers())

	// Get list of event funkcyjni
	await targetEvent.populate("roles")
	const eventFunkcyjni = targetEvent.roles.map(f => f.user.id)
	
	return html("event/setParticipants", {
		user,
		targetUnit,
		targetEvent,
		targetInvitation,
		availableMembers,
		eventFunkcyjni
	})
}