import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetEvent, targetUsers}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.INVITE_PARTICIPANT)

	// Ensure users have public role or are accessible
	for(const targetUser of targetUsers) {
		await targetUser.populate("roles")
		if(!targetUser.roles.some(r => r.hasTag("public")) && !await user.checkPermission(targetUser.PERMISSIONS.ACCESS)) {
			throw new HTTPError(403, "Brak dostępu użytkownika")
		}
	}

	// Invite users and set role
	const newRoles = []
	for(const targetUser of targetUsers) {
		// Skip users already in the event
		if(targetEvent.participants.hasID(targetUser.id)) continue
		
		await targetEvent.inviteParticipant(targetUser, undefined, false)
		const newRole = await targetEvent.setRole(targetUser, undefined, false)
		newRoles.push(newRole)
	}

	// Save event, roles and users
	await targetEvent.save()
	for(const role of newRoles) await role.save()
	for(const targetUser of targetUsers) await targetUser.save()
}