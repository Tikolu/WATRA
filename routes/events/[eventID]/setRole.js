import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.SET_ROLE)
	
	await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)
	
	let participants = [], tree

	// If user can access participants, get whole tree
	if(await user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
		tree = await targetEvent.getTree()
		
	// If user cannot access participants, only add users with roles
	} else {
		// Get all participants
		await targetEvent.populate({
			"participants": "user",
			"roles": "user"
		})
		for(const participant of targetEvent.participants) {
			if(!targetEvent.roles.find(r => r.user.id == participant.user.id)) continue
			participants.push(participant.user)
		}
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
		participants,
		tree
	})
}