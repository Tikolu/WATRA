import html from "modules/html.js"

export default async function({user}) {
	// Redirect if user already logged in
	if(user) {
		this.response.redirect("/")
		return
	}
	
	const savedUsers = [...this.token.saved || []]
	await savedUsers.populate({}, {ref: "User", placeholders: false})

	// Remove null users
	if(savedUsers.length != (this.token.saved?.length || 0)) {
		this.token.saved = savedUsers.filter(u => u).map(u => u.id)
		if(!this.token.saved.length) delete this.token.saved
	}
	
	// Render login page
	return html("login/main", {
		savedUsers
	})
}