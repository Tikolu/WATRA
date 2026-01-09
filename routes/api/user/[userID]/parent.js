import User from "modules/schemas/user"

export async function create({user, targetUser}) {
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