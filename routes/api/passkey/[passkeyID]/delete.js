import HTTPError from "modules/server/error.js"
import Passkey from "modules/schemas/passkey.js"

export default async function({user, passkeyID}) {
	if(!user) throw new HTTPError(403)
	
	const passkey = await Passkey.findById(passkeyID)

	if(!passkey) {
		throw new HTTPError(404, "Klucz dostępu nie istnieje")
	}

	await passkey.populate("user", {known: [user]})

	await user.requirePermission(passkey.user.PERMISSIONS.MANAGE_PASSKEYS)
	
	await passkey.delete()

	return {
		passkeyID: passkey.id
	}
}