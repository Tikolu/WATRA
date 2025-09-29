import HTTPError from "modules/server/error.js"

export default function({user, userID}) {
	if(!userID) {
		throw new HTTPError(400, "Nie podano ID użytkownika")
	}
	
	const token = this.request.token
	
	// Remove active user
	delete token.active
	
	// Send back token
	this.response.token = token

	// Redirect to login for new user
	this.response.redirect(`/login/${userID}`)
}