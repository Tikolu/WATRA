import html from "modules/html.js"
import User from "modules/schemas/user"
import HTTPError from "modules/server/error.js"

export async function _open({user, userID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	await user.requirePermission(targetUser.PERMISSIONS.ACCESS, "Nie masz dostępu do tego użytkownika")

	this.addRouteData({targetUser})
}

export default async function({user, targetUser}) {
	await targetUser.populate({
		"roles": "unit",
		"eventRoles": "unit",
		"eventInvites": {},
		"children": {
			"roles": "unit"
		},
		"parents": {
			"roles": "unit"
		}
	})

	// Check all permissions
	await user.checkPermission(targetUser.PERMISSIONS)
	
	if(user.id == targetUser.id) {
		await targetUser.auth.populate("keys")

		// Check child permissions
		for(const child of targetUser.children) {
			await user.checkPermission(child.PERMISSIONS.APPROVE)
		}
	}

	return html("user/page/main", {user, targetUser})
}