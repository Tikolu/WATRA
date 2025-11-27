import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"
import * as webauthn from "jsr:@simplewebauthn/server"

export default async function({user}) {
	// if(user.auth.keys.length == 0) {
	// 	throw new HTTPError(400, "Dodaj klucz dostępu do profilu aby umożliwić podpisywanie")
	// }

	const options = await webauthn.generateAuthenticationOptions({
		rpID: Config.host,
		allowCredentials: user.auth.keys,
		userVerification: "required"
	})

	this.session.setChallenge(options.challenge, options.timeout)

	return {
		options
	}
}