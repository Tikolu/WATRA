import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.SET_ROLE)
	
	await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)
	
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

	// Get user's role in event, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetEvent)
	for await(const upperUnit of targetEvent.traverse("upperUnits")) {
		if(await user.checkPermission(upperUnit.PERMISSIONS.SET_ROLE)) {
			userRole = null
			break
		}
	}
	
	return html("event/setRole", {
		user,
		userRole,
		targetEvent,
		participants
	})
}