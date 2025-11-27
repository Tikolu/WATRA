import * as webauthn from "jsr:@simplewebauthn/server"
import * as datetime from "jsr:@std/datetime"

import HTTPError from "modules/server/error.js"
import * as Config from "modules/config.js"
import * as Crypto from "modules/crypto.js"

import Passkey from "modules/schemas/passkey.js"

export default async function({user, credential}) {
	// Get expected challenge
	const expectedChallenge = this.session.getChallenge()

	if(credential) {
		// Load passkey from database
		const passkey = await Passkey.findById(credential.id)
		if(!passkey) throw new HTTPError(400, "Klucz dostępu nie istnieje")
		if(user.id != passkey.user.id) throw new HTTPError(400, "Klucz dostępu należy do innego użytkownika")

		const verification = await webauthn.verifyAuthenticationResponse({
			expectedRPID: Config.host,
			expectedOrigin: `https://${Config.host}`,
			response: credential,
			credential: passkey,
			expectedChallenge
		})
		
		if(!verification.verified) throw Error("Błąd weryfikowania klucza dostępu")
	}

	// Generate signature
	const signature = {
		name: user.displayName,
		time: Date.now()
	}
	signature.sign = await Crypto.sign(JSON.stringify(signature))
		
	return {
		signature,
		displayTime: datetime.format(new Date(signature.time), "dd/MM/yyyy HH:mm")
	}

}