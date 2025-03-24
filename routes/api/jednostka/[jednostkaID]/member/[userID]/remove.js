import HTTPError from "modules/server/error.js"

export default async function({user, targetJednostka, targetUser}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	const targetFunkcja = await targetUser.getFunkcjaInJednostka(targetJednostka)
	if(!targetFunkcja) throw new HTTPError(400, "Użytkownik nie jest członkiem jednostki")

	await targetFunkcja.delete()
}