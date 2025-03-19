import User from "modules/schemas/user.js"
import HTTPError from "modules/server/error.js"

export async function open({user, userID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	await user.requirePermission(targetUser.PERMISSIONS.ACCESS, "Nie masz dostępu do tego użytkownika")

	this.addRouteData({targetUser})
}