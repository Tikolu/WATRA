import HTTPError from "modules/server/error.js"
import Jednostka from "modules/schemas/jednostka.js";

export async function open({jednostkaID}) {
	// Get jednostka from DB, and check if exists
	const targetJednostka = await Jednostka.findById(jednostkaID)
	if(!targetJednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	this.addRouteData({targetJednostka})
}