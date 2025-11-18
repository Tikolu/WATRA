import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"
import User from "modules/schemas/user"
import Passkey from "modules/schemas/passkey.js"
import * as webauthn from "jsr:@simplewebauthn/server"

export default async function({userID}) {
	let user
	if(userID) {
		// Find user by ID
		user = await User.findById(userID)
		if(!user) throw new HTTPError(404, "Użytkownik nie istnieje")
		this.addRouteData({user})
	}
	
	// Bypass verification if user has no keys
	if(user && user.auth.keys.length == 0) {
		this.session.login(user.id)
		return {
			loggedIn: true
		}
	}

	let keys = []
	if(user) keys = user.auth.keys
	else keys = await Passkey.find({}, "id").lean()

	const options = await webauthn.generateAuthenticationOptions({
		rpID: Config.host,
		allowCredentials: keys.map(key => ({id: key._id || key.id})),
		userVerification: "required"
	})

	this.token.chall = [options.challenge, Date.now() + options.timeout]

	return {
		options,
		userID
	}
}