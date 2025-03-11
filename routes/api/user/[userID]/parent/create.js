import User from "modules/schemas/user.js"

export default async function({targetUser}) {
	// Create user
	const newUser = new User()

	// Add user as parent
	await targetUser.addParent(newUser)

	return {
		userID: newUser.id
	}
}