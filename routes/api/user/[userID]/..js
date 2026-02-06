import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"

export async function _open({user, userID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(userID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")

	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ACCESS, "Nie masz dostępu do tego użytkownika")

	this.addRouteData({targetUser})
}

export async function confirm({user, targetUser, signature}) {
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)

	// Verify signature
	await user.verifySignature(signature)

	await targetUser.confirmDetails(signature)
}

export async function unconfirm({user, targetUser}) {
	// Check permissions (approve or manage)
	if(!await user.checkPermission(targetUser.PERMISSIONS.APPROVE) && !await user.checkPermission(targetUser.PERMISSIONS.MANAGE)) {
		throw new HTTPError(403)
	}
	
	await targetUser.unconfirmDetails()
}

export async function archive({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ARCHIVE)
	
	await targetUser.archive()
}


export async function unarchive({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.ARCHIVE)
	
	await targetUser.unarchive()
}