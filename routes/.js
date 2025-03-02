import html from "modules/html.js"
import User from "modules/schemas/user.js";

export default async function({request, response}) {
	const userID = request.token?.user
	if(!userID) {
		response.redirect("/login")
		return
	}

	const user = await User.findById(userID)
	if(!user) {
		response.redirect("/logout")
		return
	}

	return html("main", {userID})
}