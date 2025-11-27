import HTTPError from "modules/server/error.js"

export default async function({user, passkeyID}) {
	if(!user) throw new HTTPError(403)
	
	await user.auth.populate("keys")
	
	const passkey = user.auth.keys.id(passkeyID)
	if(!passkey) {
		throw new HTTPError(404, "Klucz dostępu nie istnieje")
	}

	await passkey.populate("user", {known: [user]})
	await passkey.delete()

	return {
		passkeyID: passkey.id
	}
}