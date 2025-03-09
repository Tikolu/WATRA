import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"
import html from "modules/html.js"

export default async function({userID}) {
	// Get user from DB, and check if exists
	const user = await User.findById(userID)
	if(!user) throw new HTTPError(404, "Użytkownik nie istnieje")

	// Populate funkcje, and jednostki of funkcje
	await user.populate({
		path: "funkcje",
		populate: {
			path: "jednostka"
		}
	})

	return html("user/page", {user})
}