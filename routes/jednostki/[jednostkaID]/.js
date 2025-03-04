import html from "modules/html.js"

export default async function({targetJednostka}) {
	// Populate jednostka members
	await targetJednostka.populate("members")

	return html("jednostka/page", {jednostka: targetJednostka})
}