import HTTPError from "modules/server/error.js"
import Wyjazd from "modules/schemas/wyjazd.js"

export async function open({user, targetUnit, wyjazdID}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get wyjazd from DB, and check if exists
	const targetWyjazd = await Wyjazd.findById(wyjazdID)
	if(!targetWyjazd) throw new HTTPError(404, "Wyjazd nie istnieje")
	
	// Check unit invitation state
	const targetInvitation = targetWyjazd.invitedUnits.id(targetUnit.id)
	if(!targetInvitation) throw new HTTPError("Unit nie jest zaproszona na wyjazd")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie units na wyjazd nie zostało zaakceptowane")


	this.addRouteData({targetWyjazd, targetInvitation})
}