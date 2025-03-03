import HTTPError from "modules/server/error.js"
import Jednostka from "modules/schemas/jednostka.js"
import html from "modules/html.js"

export default async function({jednostkaID}) {
	// Get jednostka from DB, and check if exists
	const jednostka = await Jednostka.findById(jednostkaID)
	if(!jednostka) throw new HTTPError(404, "Jednostka nie istnieje")

	// Populate jednostka members
	await jednostka.populate("members")

	return html("jednostka/page", {jednostka})
}