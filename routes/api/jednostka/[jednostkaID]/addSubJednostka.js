import HTTPError from "modules/server/error.js"
import Jednostka from "modules/schemas/jednostka.js"

export default async function({targetJednostka, subJednostkaID}) {
	// Get user from DB, and check if exists
	const subJednostka = await Jednostka.findById(subJednostkaID)
	if(!subJednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	await targetJednostka.addSubJednostka(subJednostka)
}