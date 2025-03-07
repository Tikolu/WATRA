import Jednostka from "modules/schemas/jednostka.js"
import html from "modules/html.js"

export default async function({targetJednostka}) {
	// Find jednostki not already in subJednostki
	const jednostki = await Jednostka.find({_id: {$nin: targetJednostka.subJednostki}})

	return html("jednostka/addSubJednostka", {
		jednostka: targetJednostka,
		jednostki
	})
}