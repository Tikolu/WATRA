import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

import User from "modules/schemas/user"

export default async function({user, targetEvent, participant: targetUserID}) {
	// Get user from DB, and check if exists
	const targetUser = await User.findById(targetUserID)
	if(!targetUser) throw new HTTPError(404, "Użytkownik nie istnieje")
	
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE, "Brak dostępu do użytkownika")

	// Check if target user is a participant
	const targetInvitation = targetEvent.participants.id(targetUser.id)
	if(!targetInvitation) throw new HTTPError(404, "Użytkownik nie jest uczestnikiem tej akcji")

	// Check if event has already started
	if(targetEvent.dates.start <= new Date()) {
		throw new HTTPError(400, "Nie można zmieniać uczestnictwa po rozpoczęciu akcji")
	}

	await targetInvitation.populate(
		{"user": "parents"},
		{known: [targetUser]}
	)

	return html("event/participation", {
		user,
		targetEvent,
		targetInvitation,
	})
}