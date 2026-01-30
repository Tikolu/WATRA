import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, users: userIDs}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE, "Brak dostępu do jednostki")
		
	if(!userIDs?.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	const users = userIDs.unique()
	await users.populate({}, {ref: "User"})
	for(const id of userIDs) {
		if(!users.hasID(id)) {
			throw new HTTPError(404, "Użytkownik nie istnieje")
		}
	}

	// Get user's role
	const userRole = await user.getRoleInUnit(targetUnit)

	const rolesForRemoval = []
	for(const targetUser of users) {
		// Ensure current role is not higher in rank than user's role
		const targetUserRole = await targetUser.getRoleInUnit(targetUnit)
		if(!targetUserRole) throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie należy do jednostki`)
		if(userRole && targetUserRole.config.rank > userRole.config.rank) {
			throw new HTTPError(400, `Brak uprawnień do zdjęcia użytkownika ${targetUser.displayName} z funkcji`)
		}

		// User can only remove themselves if they have a "setRole" role in an upper unit
		if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetUnit.getUpperUnitsTree())) {
			throw new HTTPError(400, "Nie można zdjąć siebie z funkcji")
		}

		// Ensure user has at least one other role
		if(!targetUser.isParent && targetUser.roles.length <= 1) throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie posiada żadnej innej funkcji`)

		rolesForRemoval.push(targetUserRole)
	}

	// Delete roles
	for(const role of rolesForRemoval) {
		await role.delete()
	}
}