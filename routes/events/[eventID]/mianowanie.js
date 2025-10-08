import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check for permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY)
	
	// Get list of possible users for mianowanie
	const usersForMianowanie = []
	for await(const userForMianowanie of targetEvent.usersForMianowanie()) {
		// User cannot mianować themselves
		if(userForMianowanie.id == user.id) continue
		// Skip duplicates
		if(usersForMianowanie.find(u => u.id == userForMianowanie.id)) continue
		
		usersForMianowanie.push(userForMianowanie)
	}
	
	return html("event/mianowanie", {
		user,
		targetEvent,
		usersForMianowanie
	})
}