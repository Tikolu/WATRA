import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, users: userIDs, roleType}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)
	
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

	// Get role config
	const roleConfig = Config.roles[roleType]
	if(!roleConfig) throw new HTTPError(400, "Nieznana funkcja")

	// Enforce role count limit
	if("limit" in roleConfig) {
		await targetUnit.populate("roles")
		const otherRolesOfType = targetUnit.roles.filter(f => f.type == roleConfig.type)
		if(otherRolesOfType.length + users.length > roleConfig.limit) {
			throw new HTTPError(400, `Na funkcję "${roleConfig.name.default}" można mianować maksymalnie ${roleConfig.limit}`)
		}
	}

	// Get user's role in unit, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetUnit)
	await targetUnit.populate("upperUnits")
	for await(const upperUnit of targetUnit.getUpperUnitsTree()) {
		if(await user.checkPermission(upperUnit.PERMISSIONS.SET_ROLE)) {
			userRole = null
			break
		}
	}

	// Ensure new role is not higher in rank than user's role
	if(userRole && roleConfig.rank > userRole.config.rank) {
		throw new HTTPError(403, "Brak uprawnień do nadania wyższej funkcji niż własna")
	}

	const subMembers = await Array.fromAsync(targetUnit.getSubMembers())
	const newRoles = []
	for(const targetUser of users) {
		if(userRole) {
			// Ensure member's current role is not higher in rank than user's role
			const targetUserRole = await targetUser.getRoleInUnit(targetUnit)
			if(targetUserRole && targetUserRole.config.rank > userRole.config.rank) {
				throw new HTTPError(403, `Brak uprawnień do zmiany funkcji użytkownikowi ${targetUser.displayName}`)
			}

			// User cannot set their own role
			if(user.id == targetUser.id) {
				throw new HTTPError(403, "Nie można zmienić własnej funkcji")
			}
		}

		// Check if member belongs to the unit
		if(!subMembers.find(u => u.id == targetUser.id)) {
			throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie należy do jednostki`)
		}

		const newRole = await targetUnit.setRole(targetUser, roleType, false)
		newRoles.push(newRole)
	}

	// Save all roles and users
	for(const role of newRoles) await role.save()
	for(const user of users) await user.save()

	await targetUnit.save()


	return {
		roleType
	}
}