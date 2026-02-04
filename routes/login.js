import html from "modules/html.js"
import HTTPError from "modules/server/error.js"
import accessCode from "./api/login/accessCode.js"

export default async function({user, code: accessCode}) {
	if(accessCode) {
		// Check access code
		if(!/^[0-9 ]+$/.test(accessCode)) throw new HTTPError(400, "Nie prawidłowy kod rejestracyjny")
	}
	
	// If user is logged in, redirect or logout
	if(user) {
		if(accessCode) this.session.logout()
		else {
			this.response.redirect("/")
			return
		}
	}

	const savedUsers = await this.session.getSavedUsers()
	
	// Render login page
	return html("login/main", {
		savedUsers,
		accessCode
	})
}