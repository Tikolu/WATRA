import HTTPError from "modules/server/error.js";

export function _open({user}) {
	if(!user) throw new HTTPError(403)
}

export async function create({user}) {
	if(!user) throw new HTTPError(403)
	
	const creationOptions = await user.auth.passkeyCreationOptions()

	// Store challenge and its expiry in token
	this.session.setChallenge(creationOptions.challenge, creationOptions.timeout)
	
	return {
		creationOptions
	}
}

export async function save({user, credential}) {
	if(!user) throw new HTTPError(403)
	
	// Get expected challenge
	const expectedChallenge = this.session.getChallenge()

	await user.auth.savePasskey(credential, expectedChallenge)
}