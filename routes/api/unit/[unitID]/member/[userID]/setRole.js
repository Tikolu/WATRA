import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)

	// Get user's role
	const userRole = await user.getRoleInUnit(targetUnit)

	// Get role config
	const roleConfig = Config.roles[roleType]
	if(!roleConfig) throw new HTTPError(400, "Nieznana funkcja")

	// Ensure current or new role is not higher in rank than user's role
	const targetUserRole = await targetUser.getRoleInUnit(targetUnit)
	if(
		(userRole && roleConfig.rank > userRole.config.rank) ||
		(targetUserRole && userRole && targetUserRole.config.rank > userRole.config.rank)
	) {
		throw new HTTPError(400, "Nie można zmieniać funkcji wyższej niż własna")
	}

	// User can only set their own role if they have a "setRole" role in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetUnit.getUpperUnitsTree())) {
		throw new HTTPError(400, "Nie można zmienić własnej funkcji")
	}

	// Check if member belongs to the unit
	if(!await targetUnit.getSubMembers().find(u => u.id == targetUser.id)) {
		throw new HTTPError(400, "Użytkownik nie należy do jednostki")
	}

	await targetUnit.setRole(targetUser, roleType)

	return {
		roleType
	}
}