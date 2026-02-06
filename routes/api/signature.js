import * as webauthn from "jsr:@simplewebauthn/server"
import * as datetime from "jsr:@std/datetime"

import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"
import * as Crypto from "modules/crypto.js"

import Passkey from "modules/schemas/passkey.js"

export function _open({user}) {
	if(!user) throw new HTTPError(403)
}

export async function start({user}) {
	if(Config.passkeyRequired && user.auth.keys.length == 0) {
		throw new HTTPError(400, "Dodaj klucz dostępu do profilu aby umożliwić podpisywanie")
	}

	const options = await webauthn.generateAuthenticationOptions({
		rpID: Config.host,
		allowCredentials: user.auth.keys.map(key => ({id: key.id})),
		userVerification: "required",
		timeout: (10 * 60 * 1000) // 10 minutes
	})

	this.session.setChallenge(options.challenge, options.timeout)

	// Disable logging
	this.logging.disabled = true

	return {
		options
	}
}

export async function verify({user, credential}) {
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

		// Register passkey usage
		await passkey.registerUsage()
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