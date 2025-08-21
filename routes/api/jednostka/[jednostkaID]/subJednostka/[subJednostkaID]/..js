import HTTPError from "modules/server/error.js"
import Jednostka from "modules/schemas/jednostka.js"

export async function open({user, targetJednostka, subJednostkaID}) {
	// Get subJednostka from DB, and check if exists
	const targetSubJednostka = await Jednostka.findById(subJednostkaID)
	if(!targetSubJednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check if subJednostka is in jednostka
	if(!targetJednostka.subJednostki.hasID(targetSubJednostka.id)) {
		throw new HTTPError(403, "Jednostka nie jest w tej jednostce")
	}

	// Check permissions
	await user.requirePermission(targetSubJednostka.PERMISSIONS.ACCESS)

	this.addRouteData({targetSubJednostka})
}