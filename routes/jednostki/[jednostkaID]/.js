import html from "modules/html.js"

export default async function({targetJednostka}) {
	// Populate jednostka funkcje, as well as users and jednostki of funkcje
	await targetJednostka.populate({
		path: "funkcje",
		populate: ["user", "jednostka"]
	})

	// Populate sub jednostki
	await targetJednostka.populate("subJednostki")

	// Populate upper jednostki
	await targetJednostka.populate("upperJednostki")

	return html("jednostka/page", {jednostka: targetJednostka})
}