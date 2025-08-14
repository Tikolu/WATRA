import HTTPError from "modules/server/error.js"
import Wyjazd from "modules/schemas/wyjazd.js";

export async function open({user, targetJednostka, wyjazdID}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Get wyjazd from DB, and check if exists
	const targetWyjazd = await Wyjazd.findById(wyjazdID)
	if(!targetWyjazd) throw new HTTPError(404, "Wyjazd nie istnieje")
	
	// Check if jednostka is invited
	const targetInvitation = targetWyjazd.invitedJednostki.id(targetJednostka.id)
	if(!targetInvitation) {
		throw new HTTPError(400, "Jednostka nie jest zaproszona na wyjazd")
	}

	this.addRouteData({targetWyjazd, targetInvitation})
}