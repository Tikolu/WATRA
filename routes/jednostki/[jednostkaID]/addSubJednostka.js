import Jednostka from "modules/schemas/jednostka.js"
import html from "modules/html.js"
import HTTPError from "modules/server/error.js";

export default async function({targetJednostka}) {
	// Not available for zastępy
	if(targetJednostka.type == 0) throw new HTTPError(404)
	
	// Find jednostki not already in subJednostki
	const jednostki = await Jednostka.find({_id: {$nin: targetJednostka.subJednostki}})

	return html("jednostka/addSubJednostka", {
		jednostka: targetJednostka,
		jednostki
	})
}