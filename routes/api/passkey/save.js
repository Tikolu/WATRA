import HTTPError from "modules/server/error.js"

export default async function({user, credential}) {
	// Validate challenge expiry
	const [expectedChallenge, expiry] = this.token.chall || []
	if(!expiry || Date.now() > expiry) {
		delete this.token.chall
		throw new HTTPError(400, "Minął termin ważności weryfikacji, spróbuj ponownie")
	}

	await user.auth.savePasskey(credential, expectedChallenge)

	delete this.token.chall
}