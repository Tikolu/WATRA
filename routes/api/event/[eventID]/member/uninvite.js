import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUsers}) {
	await targetEvent.populate({"participants": "originUnit"})
	
	for(const targetUser of targetUsers) {
		// Check if users are participants
		const participant = targetEvent.participants.id(targetUser.id)
		if(!participant) {
			throw new HTTPError(404, "Użytkownik nie jest uczestnikiem akcji")
		}
		// Check permissions
		if(!await user.checkPermission(targetEvent.PERMISSIONS.EDIT_PARTICIPANTS)) {
			await user.requirePermission(participant.originUnit.PERMISSIONS.MANAGE_INVITES, "Brak dostępu do użytkownika")
		}
	}

	// Remove users from event
	for(const targetUser of targetUsers) {
		await targetEvent.participants.id(targetUser).uninvite(false)
	}

	// Save event
	await targetEvent.save()
}