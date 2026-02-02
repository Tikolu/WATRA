import * as webauthn from "jsr:@simplewebauthn/server"

import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"
import Config from "modules/config.js"
import Passkey from "modules/schemas/passkey.js"

export default async function({credential, userID}) {
	// Validate user ID
	if(userID && !/^[a-f0-9]{8}$/.test(userID)) throw new HTTPError(400)

	// Get expected challenge
	const expectedChallenge = this.session.getChallenge()

	// Load passkey from database
	const passkey = await Passkey.findById(credential.id)
	if(!passkey) throw new HTTPError(400, "Klucz dostępu nie istnieje")
	if(userID && userID != passkey.user.id) throw new HTTPError(400, "Klucz dostępu nie należy do podanego użytkownika")

	const verification = await webauthn.verifyAuthenticationResponse({
		expectedRPID: Config.host,
		expectedOrigin: `https://${Config.host}`,
		response: credential,
		credential: passkey,
		expectedChallenge
	})
	
	if(!verification.verified) throw Error("Błąd weryfikowania klucza dostępu")

	// Find user
	await passkey.populate("user", {placeholders: false})
	if(!passkey.user) throw new HTTPError(404, "Użytkownik nie istnieje")
	this.addRouteData({
		user: passkey.user
	})

	// Register passkey usage
	await passkey.registerUsage()

	await this.session.login(passkey.user)
		
	return {
		userID: passkey.user.id
	}

}