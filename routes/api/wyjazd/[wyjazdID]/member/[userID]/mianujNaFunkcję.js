import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetUser, funkcjaType}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY, "Brak dostępu do wyjazdu")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User cannot mianować themselves
	if(user.id == targetUser.id) throw new HTTPError(400, "Nie można mianować samego siebie")

	// Ensure user can be mianowany
	const usersForMianowanie = await Array.fromAsync(targetWyjazd.usersForMianowanie())
	if(!usersForMianowanie.some(u => u.id == targetUser.id)) {
		throw new HTTPError(400, "Użytkownik nie może być mianowany na funkcję")
	}

	await targetWyjazd.setFunkcja(targetUser, funkcjaType)
}