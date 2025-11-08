import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.EDIT, "Brak dostępu do użytkownika")

	// User can only set their own role if they have a "setRole" role in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można zmienić własnej funkcji")
	}

	await targetUnit.setRole(targetUser, roleType)

	return {
		roleType
	}
}