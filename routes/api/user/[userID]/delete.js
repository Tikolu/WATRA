import User from "modules/schemas/user"
import HTTPError from "modules/server/error.js"

export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.DELETE)
	
	await targetUser.delete()
}