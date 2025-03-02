import html from "modules/html.js";

export default function({request, response}) {
	// Check if user is already logged in
	if(request.token?.user) {
		response.redirect("/")
		return
	}

	// Render login page
	return html("login")
}