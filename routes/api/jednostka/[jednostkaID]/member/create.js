import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"

export default async function({targetJednostka}) {
	// Create user
	const newUser = new User()

	// Add user as member
	await targetJednostka.addMember(newUser)

	return {
		userID: newUser.id
	}
}