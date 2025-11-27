import html from "modules/html.js"
import * as Text from "modules/text.js"

import HTTPError from "modules/server/error.js"

export default async function({user, targetUser}) {
	// Check permissions
	await user.checkPermission(targetUser.PERMISSIONS.APPROVE)
	await user.checkPermission(targetUser.PERMISSIONS.MANAGE)

	const editable = await user.checkPermission(targetUser.PERMISSIONS.EDIT) && !targetUser.medical.confirmed

	return html("user/medical", {
		user,
		targetUser,
		editable
	})
}