import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"
import html from "modules/html.js"

export default async function({user, targetUser}) {
	await targetUser.populate({
		"funkcje": "unit",
		"eventFunkcje": "unit",
		"eventApprovalRequests": {},
		"children": {
			"funkcje": "unit"
		},
		"parents": {
			"funkcje": "unit"
		}
	})

	// Check permissions
	if(await user.checkPermission(targetUser.PERMISSIONS.MODIFY)) {
		await user.checkPermission(targetUser.PERMISSIONS.DELETE)
		await user.checkPermission(targetUser.PERMISSIONS.ADD_PARENT)
	} else {
		user.overridePermission(targetUser.PERMISSIONS.DELETE, false)
		user.overridePermission(targetUser.PERMISSIONS.ADD_PARENT, false)
	}
	
	// Load event invites
	if(await user.checkPermission(targetUser.PERMISSIONS.APPROVE)) {
		await targetUser.populate("eventInvites")
	}
	

	return html("user/page", {user, targetUser})
}