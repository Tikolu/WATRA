import HTTPError from "modules/server/error.js"

export default function({user, remove}) {
	if(remove) {
		// Validate user ID
		if(!/^[a-f0-9]{8}$/.test(remove)) throw new HTTPError(400)
		
		// Remove user from saved users
		this.token.saved = this.token.saved.filter(id => id != remove)
		if(!this.token.saved.length) delete this.token.saved
	}

	// Log out
	this.session.logout()
}