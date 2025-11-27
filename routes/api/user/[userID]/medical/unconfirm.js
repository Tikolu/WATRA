import HTTPError from "modules/server/error.js"

export default async function({user, targetUser}) {
	// Check permissions
	if(!await user.checkPermission(targetUser.PERMISSIONS.APPROVE) && !await user.checkPermission(targetUser.PERMISSIONS.MANAGE)) {
		throw new HTTPError(403)
	}
	
	await targetUser.medical.unconfirm()
}