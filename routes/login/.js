import html from "modules/html.js"

export default async function() {
	// Load token
	const token = this.request.token
	
	const savedUsers = token?.saved || []
	await savedUsers.populate({}, {ref: "User", placeholders: false})

	token.saved = savedUsers.filter(u => u).map(u => u.id) // Remove null users

	// Send back token
	this.response.token = token
	
	// Render login page
	return html("login/main", {
		savedUsers
	})
}