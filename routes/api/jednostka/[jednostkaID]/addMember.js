import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"

export default async function({targetJednostka, input}) {
	// Get user from DB, and check if exists
	const userToAdd = await User.findById(input.userID)
	if(!userToAdd) throw new HTTPError(404, "Użytkownik nie istnieje")

	await targetJednostka.addMember(userToAdd)
}