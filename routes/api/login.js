import HTTPError from "modules/server/error.js";
import User from "modules/schemas/user.js";
import randomID from "modules/randomID.js";

export default async function({user, accessCode, userID}) {
	// Check if user is already logged in
	if(user) throw new HTTPError(400, "Już jesteś zalogowany")

	const savedUsers = this.request.token?.saved || []

	// Verify saved user
	if(userID) {
		if(!savedUsers.includes(userID)) return HTTPError(403, "Użytkownik nie jest zapisany")
		user = await User.findById(userID)
		if(!user) return HTTPError(400, "Użytkownik nie istnieje")

	// Login using access code
	} else if(accessCode) {
		// Find user matching the access code
		user = await User.findByAccessCode(accessCode)
		if(!user) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
		
		// Clear access code 
		user.accessCode = null

	} else {
		throw new HTTPError(400)
	}

	// Get client ID and add to user
	const clientID = this.request.token?.client || randomID()
	// user.clients.register(client, this.request)

	await user.save()

	// Log event
	await user.logEvent("LOGIN")

	// Update saved users
	if(!savedUsers.includes(user.id)) savedUsers.push(user.id)

	// Set cookie token
	this.response.token = {
		saved: savedUsers,
		active: user.id,
		client: clientID
	}
		
	return {
		userID: user.id
	}
}