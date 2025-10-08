import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUser, funkcjaType}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY, "Brak dostępu do akji")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User cannot mianować themselves
	if(user.id == targetUser.id) throw new HTTPError(400, "Nie można mianować samego siebie")

	// Ensure user can be mianowany
	const usersForMianowanie = await Array.fromAsync(targetEvent.usersForMianowanie())
	if(!usersForMianowanie.some(u => u.id == targetUser.id)) {
		throw new HTTPError(400, "Użytkownik nie może być mianowany na funkcję")
	}

	await targetEvent.setFunkcja(targetUser, funkcjaType)

	return {
		funkcjaType
	}
}