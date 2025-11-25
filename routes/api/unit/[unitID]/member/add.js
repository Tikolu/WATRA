import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetUnit, users: userIDs, moveUser}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)

	if(!userIDs?.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	const users = [...userIDs]
	await users.populate({}, {ref: "User"})
	for(const id of userIDs) {
		if(!users.hasID(id)) {
			throw new HTTPError(404, "Użytkownik nie istnieje")
		}
	}
	
	const members = await targetUnit.getMembers()
	for(const targetUser of users) {
		// Check if user is already a member
		if(members.hasID(targetUser.id)) {
			throw new HTTPError(400, `Użytkownik ${targetUser.displayName} jest już członkiem jednostki`)
		}

		// Check permissions
		if(!await user.hasRoleInUnits("manageUser", targetUser.getUnitsTree())) {
			throw new HTTPError(403, `Nie masz uprawnień do dodania użytkownika ${targetUser.displayName}`)
		}

		// Add user to unit
		const newRole = await targetUnit.setRole(targetUser, undefined, false)
		await newRole.save()
	}

	await targetUnit.save()


	if(moveUser) {
		await users.populate({"roles": "unit"})
	}

	for(const targetUser of users) {
		if(moveUser) {
			const roles = [...targetUser.roles]

			// Remove user from existing unit
			for(const role of roles) {
				// Skip role in new unit
				if(role.unit.id == targetUnit.id) continue
				// Skip role with rank higher than 0
				if(role.config.rank > 0) continue
				await role.delete()
			}
		}
		await targetUser.save()
	}
}