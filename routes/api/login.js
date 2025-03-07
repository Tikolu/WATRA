import HTTPError from "modules/server/error.js";
import User from "modules/schemas/user.js";

export default async function({user, code}) {
	// Check if user is already logged in
	if(user) throw new HTTPError(400, "Już jesteś zalogowany")

	// Find user matching the access code
	user = await User.findByAccessCode(code)
	if(!user) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
	
	// Clear access code 
	user.accessCode = null
	await user.save()

	// Set cookie token
	this.response.token = {
		user: user.id
	}
		
	return {
		userID: user.id
	}
}