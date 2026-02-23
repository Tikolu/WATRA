import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, userIDs}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE, "Brak dostępu do jednostki")

	const users = Array.create(userIDs).unique()
	
	if(!users.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	await users.populate({}, {
		ref: "User",
		placeholders: new HTTPError(404, "Użytkownik nie istnieje")
	})

	// Get user's role in unit, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetUnit)
	if(await targetUnit.traverse("upperUnits").some(u => user.checkPermission(u.PERMISSIONS.SET_ROLE))) {
		userRole = null
	}

	const rolesForRemoval = []
	for(const targetUser of users) {
		// Ensure current role is not higher in rank than user's role
		const targetUserRole = await targetUser.getRoleInUnit(targetUnit)
		if(!targetUserRole) throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie należy do jednostki`)

		if(userRole) {
			if(targetUserRole.config.rank > userRole.config.rank) {
				throw new HTTPError(400, `Brak uprawnień do zdjęcia użytkownika ${targetUser.displayName} z funkcji`)
			}

			// User cannot remove their own role
			if(user.id == targetUser.id) {
				throw new HTTPError(400, "Nie można zdjąć siebie z funkcji")
			}
		}

		// Ensure user has at least one other role
		if(!targetUser.isParent && targetUser.roles.length <= 1) throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie posiada żadnej innej funkcji`)

		rolesForRemoval.push(targetUserRole)
	}

	// Delete roles
	for(const role of rolesForRemoval) {
		await role.delete()
	}

	return {
		userIDs
	}
}