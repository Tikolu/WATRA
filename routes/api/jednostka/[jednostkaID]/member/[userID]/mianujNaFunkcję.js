import HTTPError from "modules/server/error.js"

export default async function({user, targetJednostka, targetUser, funkcjaType}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User cannot mianować themselves
	if(user.id == targetUser.id) throw new HTTPError(400, "Nie można mianować samego siebie")

	await targetJednostka.setFunkcja(targetUser, funkcjaType)
}