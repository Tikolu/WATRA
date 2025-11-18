import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"

export default async function({accessCode}) {
	// Find user matching the access code
	const user = await User.findByAccessCode(accessCode)
	if(!user) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
	
	this.session.login(user.id)
	
	// Clear access code 
	user.auth.accessCode = undefined
	// user.clients.register(this.session.clientID, this.request)
	await user.save()

	// Add user to route data
	this.addRouteData({user})
		
	return {
		userID: user.id
	}
}