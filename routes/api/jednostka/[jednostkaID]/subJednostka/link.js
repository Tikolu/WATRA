import HTTPError from "modules/server/error.js"
import Jednostka from "modules/schemas/jednostka.js"

export default async function({user, targetJednostka, subJednostkaID}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)

	// Get subJednostka from DB, and check if exists
	const subJednostka = await Jednostka.findById(subJednostkaID)
	if(!subJednostka) throw new HTTPError(404, "Pod-jednostka nie istnieje")

	await targetJednostka.addSubJednostka(subJednostka)
}