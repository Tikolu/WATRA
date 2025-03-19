import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"

export default async function({user, targetJednostka}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)

	// Create user
	const newUser = new User()

	// Add user as member
	await targetJednostka.addMember(newUser)

	return {
		userID: newUser.id
	}
}