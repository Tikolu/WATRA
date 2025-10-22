import HTTPError from "modules/server/error.js"
import { RoleType } from "modules/types.js"

export default async function({user, targetUnit, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY, "Brak dostępu do użytkownika")

	// User can only change their own role if they are a drużynowy in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits(RoleType.DRUŻYNOWY, targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można zmienić własnej funkcji")
	}

	await targetUnit.setRole(targetUser, roleType)

	return {
		roleType
	}
}