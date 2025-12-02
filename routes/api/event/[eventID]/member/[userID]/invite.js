import HTTPError from "modules/server/error.js"
import Config from "modules/config.js";

export default async function({user, targetEvent, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.INVITE_PARTICIPANT)

	// Ensure user has "public" role
	await targetUser.populate("roles")
	if(!targetUser.roles.some(r => r.hasTag("public"))) throw new HTTPError(403, "Nie masz dostępu do tego użytkownika")

	await targetEvent.inviteParticipant(targetUser)

	await targetEvent.setRole(targetUser)
}