import HTTPError from "modules/server/error.js"
import Wyjazd from "modules/schemas/wyjazd.js"

export async function open({user, targetJednostka, wyjazdID}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Get wyjazd from DB, and check if exists
	const targetWyjazd = await Wyjazd.findById(wyjazdID)
	if(!targetWyjazd) throw new HTTPError(404, "Wyjazd nie istnieje")
	
	// Check jednostka invitation state
	const invitation = targetWyjazd.invitedJednostki.find(i => i.jednostka == targetJednostka.id);
	if(!invitation) throw new HTTPError("Jednostka nie jest zaproszona na wyjazd")
	if(invitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na wyjazd nie zostało zaakceptowane")


	this.addRouteData({targetWyjazd})
}