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
	
	// Auto login if logged out more than a minute ago
	let autoLogin = false
	if(!accessCode && savedUsers.length == 1 && savedUsers[0].auth.keys.length > 0) {
		const logoutTime = Date.now() - (this.request.token.time || 0)
		autoLogin = logoutTime > 60 * 1000
	}

	// Render login page
	return html("login", {
		autoLogin,
		savedUsers,
		accessCode
	})
}