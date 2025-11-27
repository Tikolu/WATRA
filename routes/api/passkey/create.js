import HTTPError from "modules/server/error.js"

export default async function({user}) {
	if(!user) throw new HTTPError(403)
	
	const creationOptions = await user.auth.passkeyCreationOptions()

	// Store challenge and its expiry in token
	this.session.setChallenge(creationOptions.challenge, creationOptions.timeout)
	
	return {
		creationOptions
	}
}