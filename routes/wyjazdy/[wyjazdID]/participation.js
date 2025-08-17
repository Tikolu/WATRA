import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import User from "modules/schemas/user.js"

export default async function({user, targetWyjazd, participant: targetUserID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(targetUserID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")
	
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE, "Brak dostępu do użytkownika")

	// Check if target user is a participant
	const targetInvitation = targetWyjazd.findUserInvite(targetUser)
	if(!targetInvitation) throw new HTTPError(404, "Użytkownik nie jest uczestnikiem tego wyjazdu")

	return html("wyjazd/participation", {
		user,
		targetWyjazd,
		targetInvitation
	})
}