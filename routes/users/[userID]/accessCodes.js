import html from "modules/html.js"

import HTTPError from "modules/server/error.js"

export default async function({user, targetUser}) {
	// Check for permissions
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)

	// Generate access code for user
	await targetUser.generateAccessCode()

	// Generate access code for parent
	await targetUser.populate("parents")
	await targetUser.parents[0]?.generateAccessCode()
	
	return html("user/accessCodes", {
		targetUser
	})
}