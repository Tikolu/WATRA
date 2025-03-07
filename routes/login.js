import html from "modules/html.js";

export default function({user}) {
	// Check if user is already logged in
	if(user) {
		this.response.redirect("/")
		return
	}

	// Render login page
	return html("login")
}