export default async function({user}) {
	const creationOptions = await user.auth.passkeyCreationOptions()

	// Store challenge and its expiry in token
	this.token.chall = [creationOptions.challenge, Date.now() + creationOptions.timeout]
	
	return {
		creationOptions
	}
}