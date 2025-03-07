import html from "modules/html.js"

export default async function({targetJednostka}) {
	// Populate jednostka members
	await targetJednostka.populate("members")

	// Populate sub jednostki
	await targetJednostka.populate("subJednostki")

	// Populate upper jednostki
	await targetJednostka.populate("upperJednostki")

	return html("jednostka/page", {jednostka: targetJednostka})
}