import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import Jednostka from "modules/schemas/jednostka.js"

export default async function({user, targetWyjazd, jednostka: jednostkaID}) {
	// Get jednostka from DB, and check if exists
	const targetJednostka = await Jednostka.findById(jednostkaID)
	if(!targetJednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Check jednostka invitation state
	const targetInvitation = targetWyjazd.invitedJednostki.id(targetJednostka.id)
	if(!targetInvitation) throw new HTTPError("Jednostka nie jest zaproszona na wyjazd")
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na wyjazd nie zostało zaakceptowane")

	this.addRouteData({targetJednostka, targetInvitation})
	
	const availableMembers = await Array.fromAsync(targetJednostka.getSubMembers())

	// Get list of wyjazd funkcyjni
	await targetWyjazd.populate("funkcje")
	const wyjazdFunkcyjni = targetWyjazd.funkcje.map(f => f.user.id)
	
	return html("wyjazd/setParticipants", {
		user,
		targetJednostka,
		targetWyjazd,
		targetInvitation,
		availableMembers,
		wyjazdFunkcyjni
	})
}