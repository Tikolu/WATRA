import Wyjazd from "modules/schemas/wyjazd.js"
import HTTPError from "modules/server/error.js"

export async function open({user, wyjazdID}) {
	// Get wyjazd from DB, and check if exists
	const targetWyjazd = await Wyjazd.findById(wyjazdID)
	if(!targetWyjazd) throw new HTTPError(404, "Wyjazd nie istnieje")

	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.ACCESS, "Nie masz dostępu do tego wyjazdu")

	this.addRouteData({targetWyjazd})
}