import html from "modules/html.js"
import Jednostka from "modules/schemas/jednostka.js";

export default async function() {
	// Get list of all jednostki
	const jednostki = await Jednostka.find()
	
	return html("jednostka/list", {
		jednostki
	})
}