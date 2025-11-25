import html from "modules/html.js"
import HTTPError from "modules/server/error.js"
import accessCode from "./api/login/accessCode.js";

export default async function({user, code: accessCode}) {
	if(accessCode) {
		// Check access code
		if(!/^[0-9 ]+$/.test(accessCode)) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
	}
	
	// If user is logged in, redirect or logout
	if(user) {
		if(accessCode) this.session.logout()
		else {
			this.response.redirect("/")
			return
		}
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
		savedUsers,
		accessCode
	})
}