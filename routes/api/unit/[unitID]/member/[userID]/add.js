import HTTPError from "modules/server/error.js"
import * as Text from "modules/text.js"

import User from "modules/schemas/user"

export default async function({user, targetUnit, targetUser, moveUser}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)
	if(!await user.hasRoleInUnits("manageUser", targetUser.getUnitsTree())) {
		throw new HTTPError(403, "Nie masz uprawnień do dodania tego użytkownika")
	}

	// Check if user is already a member
	const members = await targetUnit.getMembers()
	if(members.hasID(targetUser.id)) {
		throw new HTTPError(400, "Użytkownik jest już członkiem jednostki")
	}

	// Add user to unit
	await targetUnit.setRole(targetUser)

	// Remove user from existing unit
	if(moveUser) {
		await targetUser.populate("roles")
		for(const role of targetUser.roles) {
			// Skip role with rank higher than 0
			if(role.config.rank > 0) continue
			await role.delete()
		}
	}
}