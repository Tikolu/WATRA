import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE, "Brak dostępu do jednostki")
	await user.requirePermission(targetUser.PERMISSIONS.EDIT, "Brak dostępu do użytkownika")

	// User can only remove themselves if they have a "setRole" role in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można usunąć samego siebie")
	}

	const targetRole = await targetUser.getRoleInUnit(targetUnit)
	if(!targetRole) throw new HTTPError(400, "Użytkownik nie jest członkiem jednostki")

	// Ensure user has at least one other role
	if(!targetUser.isParent && targetUser.roles.length <= 1) throw Error("Użytkownik nie może zostać bez funkcji")

	await targetRole.delete()
}