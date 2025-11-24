import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE, "Brak dostępu do jednostki")

	// Get user's role
	const userRole = await user.getRoleInUnit(targetUnit)

	// Ensure current role is not higher in rank than user's role
	const targetUserRole = await targetUser.getRoleInUnit(targetUnit)
	if(!targetUserRole) throw new HTTPError(400, "Użytkownik nie jest członkiem jednostki")
	if(userRole && targetUserRole.config.rank > userRole.config.rank) {
		throw new HTTPError(400, "Nie można zmieniać funkcji wyższej niż własna")
	}

	// User can only remove themselves if they have a "setRole" role in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można usunąć samego siebie")
	}

	// Ensure user has at least one other role
	if(!targetUser.isParent && targetUser.roles.length <= 1) throw Error("Użytkownik nie może zostać bez funkcji")

	await targetUserRole.delete()
}