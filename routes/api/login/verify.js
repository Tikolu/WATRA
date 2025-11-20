import * as webauthn from "jsr:@simplewebauthn/server"

import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"
import Config from "modules/config.js"
import Passkey from "modules/schemas/passkey.js"

export default async function({credential, userID}) {
	// Validate user ID
	if(userID && !/^[a-f0-9]{8}$/.test(userID)) throw new HTTPError(400)

	// Validate challenge expiry
	const [expectedChallenge, expiry] = this.token.chall || []
	if(!expiry || Date.now() > expiry) {
		delete this.token.chall
		throw new HTTPError(400, "Minął termin ważności weryfikacji, spróbuj ponownie")
	}

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
	
	delete this.token.chall
	if(!verification.verified) throw Error("Błąd weryfikowania klucza dostępu")

	// Find user
	await passkey.populate("user", {placeholders: false})
	if(!passkey.user) throw new HTTPError(404, "Użytkownik nie istnieje")
	this.addRouteData({
		user: passkey.user
	})

	// Register passkey usage
	passkey.lastUsed = new Date()
	await passkey.save()

	this.session.login(passkey.user.id)
		
	return {
		userID: passkey.user.id
	}

}