import HTTPError from "modules/server/error.js"

export default async function({user, credential}) {
	if(!user) throw new HTTPError(403)
	
	// Get expected challenge
	const expectedChallenge = this.session.getChallenge()

	await user.auth.savePasskey(credential, expectedChallenge)
}