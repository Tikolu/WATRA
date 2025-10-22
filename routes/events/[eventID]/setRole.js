import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY)
	
	// Get list of possible users which can have a role assigned
	const usersForAssignment = []
	for await(const userForMianowanie of targetEvent.usersForAssignment()) {
		// User cannot set their own role
		if(userForMianowanie.id == user.id) continue
		// Skip duplicates
		if(usersForAssignment.find(u => u.id == userForMianowanie.id)) continue
		
		usersForAssignment.push(userForMianowanie)
	}
	
	return html("event/setRole", {
		user,
		targetEvent,
		usersForAssignment
	})
}