import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js"

export async function open({userID, addRouteData}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	addRouteData({targetUser})
}