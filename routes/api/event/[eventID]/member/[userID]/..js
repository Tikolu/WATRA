import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"

export async function _open({userID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	this.addRouteData({targetUser})
}