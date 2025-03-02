import html from "modules/html.js"
import User from "modules/schemas/user.js";

export default async function({request, response}) {
	// If no user token, redirect to login page
	const userID = request.token?.user
	if(!userID) {
		response.redirect("/login")
		return
	}

	// If user does not exist, logout
	const user = await User.findById(userID)
	if(!user) {
		response.redirect("/logout")
		return
	}

	return html("main", {
		userID
	})
}