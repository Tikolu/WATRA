import User from "modules/schemas/user.js"
import html from "modules/html.js"

export default async function({targetJednostka}) {
	// Find users not already in jednostka
	const users = await User.find({_id: {$nin: targetJednostka.members}})

	return html("jednostka/addMember", {
		jednostka: targetJednostka,
		users
	})
}