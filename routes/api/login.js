import HTTPError from "modules/server/error.js";
import User from "modules/schemas/user.js";

export default async function({request, response, input}) {
	// Check if user is already logged in
	if(request.token?.user) throw new HTTPError(400, "Już jesteś zalogowany")

	// Find user matching the access code
	const user = await User.findByAccessCode(input.code)
	if(!user) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
	
	// Clear access code 
	user.accessCode = null
	await user.save()

	// Set cookie token
	response.token = {
		user: user.id
	}
		
	return {
		userID: user.id
	}
}