import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import Unit from "modules/schemas/unit"

export default async function({user, targetEvent, unit: unitID}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_INVITES)
	
	// Check unit invitation state
	const targetInvitation = targetEvent.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) throw new HTTPError("Jednostka nie jest zaproszona na akcję")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na akcję nie zostało zaakceptowane")

	this.addRouteData({targetUnit, targetInvitation})
	
	// Get all direct members
	const members = {}
	const directMembers = await targetUnit.getMembers()
	if(directMembers.length) members[""] = directMembers
	// Get all subMembers of subUnits
	await targetUnit.populate("subUnits")
	for(const unit of targetUnit.subUnits) {
		const subMembers = await Array.fromAsync(unit.getSubMembers())
		members[unit.displayName] = subMembers
	}

	return html("event/setParticipants", {
		user,
		targetUnit,
		targetEvent,
		targetInvitation,
		members
	})
}