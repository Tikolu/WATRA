import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"
import html from "modules/html.js"

export default async function({user, targetUser}) {
	// Populate funkcje, and jednostki of funkcje
	await targetUser.populate({
		path: "funkcje",
		populate: {
			path: "jednostka"
		}
	})

	// Populate parents or children
	await targetUser.populate(targetUser.isParent ? "children" : "parents")

	return html("user/page", {user, targetUser})
}