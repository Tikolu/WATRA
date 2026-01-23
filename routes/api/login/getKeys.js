import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"
import User from "modules/schemas/user"
import * as webauthn from "jsr:@simplewebauthn/server"

export default async function({userID}) {
	let user
	if(userID) {
		// Ensure user is in savedUsers token
		const savedUsers = this.request.token.saved || []
		if(!savedUsers.includes(userID)) {
			throw new HTTPError(403, "Brak dostępu do podanego użytkownika")
		}
		
		// Find user by ID
		user = await User.findById(userID)
		if(!user) throw new HTTPError(404, "Użytkownik nie istnieje")
		this.addRouteData({user})
	}
	
	// Bypass verification if user has no keys
	if(user && user.auth.keys.length == 0) {
		await this.session.login(user)
		return {
			loggedIn: true
		}
	}

	const keys = user?.auth.keys.map(key => ({id: key.id}))

	const options = await webauthn.generateAuthenticationOptions({
		rpID: Config.host,
		allowCredentials: keys,
		userVerification: "required",
		timeout: (10 * 60 * 1000) // 10 minutes
	})

	this.session.setChallenge(options.challenge, options.timeout)

	return {
		options,
		userID
	}
}