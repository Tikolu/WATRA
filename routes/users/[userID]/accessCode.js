import html from "modules/html.js"

import HTTPError from "modules/server/error.js"

export default async function({user, targetUser, parent: parentCode}) {
	// Check for permissions
	await user.requirePermission(targetUser.PERMISSIONS.GENERATE_ACCESS_CODE)

	// Generate access code for parent
	let generateUser = targetUser
	if(parentCode) {
		if(targetUser.parents.length == 0) {
			throw new HTTPError(400, "Użytkownik nie ma rodziców")
		}
		await targetUser.populate("parents")
		generateUser = targetUser.parents[0]
	}

	// Generate access code	
	await generateUser.auth.generateAccessCode(1000 * 60 * 5)

	// Log event
	await user.logEvent(`user/${generateUser.id}/accessCode/generate`, {
		request: this.request,
		targetUser: generateUser.id
	})
	
	return html("user/accessCode", {
		user,
		parentCode,
		targetUser
	})
}