import html from "modules/html.js";

export default function({request, response}) {
	// Check if user is already logged in
	if(request.token?.user) return response.redirect("/")

	// Render login page
	return html("login")
}