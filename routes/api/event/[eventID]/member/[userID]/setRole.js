import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY, "Brak dostępu do akji")
	await user.requirePermission(targetUser.PERMISSIONS.EDIT, "Brak dostępu do użytkownika")

	// User cannot set their own role
	if(user.id == targetUser.id) throw new HTTPError(400, "Nie można mianować samego siebie")

	// Ensure user can have a role assigned
	const usersForAssignment = await Array.fromAsync(targetEvent.usersForAssignment())
	if(!usersForAssignment.some(u => u.id == targetUser.id)) {
		throw new HTTPError(400, "Użytkownik nie może być mianowany na funkcję")
	}

	await targetEvent.setRole(targetUser, roleType)

	return {
		roleType
	}
}