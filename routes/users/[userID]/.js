import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"
import html from "modules/html.js"

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
	}

	return html("user/page", {user, targetUser})
}