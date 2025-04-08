import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetUser}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY, "Brak dostępu do wyjazdu")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User remove themselves
	if(user.id == targetUser.id) throw new HTTPError(400, "Nie można usunąć samego siebie")

	const targetFunkcja = await targetUser.getFunkcjaInJednostka(targetWyjazd)
	if(!targetFunkcja) throw new HTTPError(400, "Użytkownik nie jest członkiem wyjazdu")

	await targetFunkcja.delete()
}