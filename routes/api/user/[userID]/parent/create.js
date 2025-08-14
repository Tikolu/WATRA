import User from "modules/schemas/user.js"

export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ADD_PARENT)
	
	// Create user
	const newUser = new User()

	// Add user as parent
	await targetUser.addParent(newUser)

	return {
		userID: newUser.id
	}
}