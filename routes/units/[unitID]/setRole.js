import html from "modules/html.js"
import { RoleType } from "modules/types.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get all members which can have a role assigned
	const usersForAssignment = []
	await user.populate("roles")
	for(const role of user.roles) {
		if(role.type < RoleType.DRUŻYNOWY) continue
		await role.populate("unit")
		for await(const member of role.unit.getSubMembers([user.id])) {
			if(usersForAssignment.hasID(member.id)) continue
			usersForAssignment.push(member)
		}
	}
	
	return html("unit/setRole", {
		user,
		targetUnit,
		usersForAssignment
	})
}