import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import Unit from "modules/schemas/unit.js"

export default async function({user, targetWyjazd, unit: unitID}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Unit nie istnieje")

	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Check unit invitation state
	const targetInvitation = targetWyjazd.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) throw new HTTPError("Unit nie jest zaproszona na wyjazd")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie units na wyjazd nie zostało zaakceptowane")

	this.addRouteData({targetUnit, targetInvitation})
	
	const availableMembers = await Array.fromAsync(targetUnit.getSubMembers())

	// Get list of wyjazd funkcyjni
	await targetWyjazd.populate("funkcje")
	const wyjazdFunkcyjni = targetWyjazd.funkcje.map(f => f.user.id)
	
	return html("wyjazd/setParticipants", {
		user,
		targetUnit,
		targetWyjazd,
		targetInvitation,
		availableMembers,
		wyjazdFunkcyjni
	})
}