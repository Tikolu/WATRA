import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.SET_ROLE)
	
	await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)
	
	const usersForAssignment = {}
	// Get all participants
	await targetEvent.populate({
		"participants": "user",
		"roles": "user"
	})
	const participants = []
	for(const participant of targetEvent.participants) {
		// If user cannot access participants, only add users with roles
		if(!await user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
			if(!targetEvent.roles.find(r => r.user.id == participant.user.id)) continue
		}
		participants.push(participant.user)
	}
	if(participants.length) usersForAssignment[""] = participants

	// If user has "manageUser" role in upperUnit, add all subMembers of unit
	await targetEvent.populate("upperUnits")
	for(const unit of targetEvent.upperUnits) {
		if(!await user.hasRoleInUnits("manageUser", unit.traverse("upperUnits", {includeSelf: true}))) continue

		// Add all direct members
		usersForAssignment[unit.displayName] = await unit.listMembers().toArray()

		// Add all members of subUnits
		await unit.populate("subUnits")
		for(const subUnit of unit.subUnits) {
			const subMembers = await subUnit.listMembers(true).toArray()
			usersForAssignment[subUnit.displayName] = subMembers
		}
	}

	// Get user's role in event
	const userRole = await user.getRoleInUnit(targetEvent)
	
	return html("event/setRole", {
		user,
		userRole,
		targetEvent,
		usersForAssignment
	})
}