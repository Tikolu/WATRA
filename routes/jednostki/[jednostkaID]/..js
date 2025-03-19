import Jednostka from "modules/schemas/jednostka.js"
import HTTPError from "modules/server/error.js"

export async function open({user, jednostkaID}) {
	// Get jednostka from DB, and check if exists
	const targetJednostka = await Jednostka.findById(jednostkaID)
	if(!targetJednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	await user.requirePermission(targetJednostka.PERMISSIONS.ACCESS, "Nie masz dostępu do tej jednostki")

	this.addRouteData({targetJednostka})
}