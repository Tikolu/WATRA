import html from "modules/html.js"

import HTTPError from "modules/server/error.js"

export default async function({user, targetUser, parent: parentCode}) {
	// Check for permissions
	await user.requirePermission(targetUser.PERMISSIONS.GENERATE_ACCESS_CODE)

	// Generate access code for parent
	if(parentCode) {
		if(targetUser.parents.length == 0) {
			throw new HTTPError(400, "Użytkownik nie ma rodziców")
		}
		await targetUser.populate("parents")
		await targetUser.parents[0].auth.generateAccessCode(1000 * 60 * 5)

	// Generate access code for user
	} else {
		await targetUser.auth.generateAccessCode(1000 * 60 * 5)
	}
	
	return html("user/accessCode", {
		user,
		parentCode,
		targetUser
	})
}