import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetEvent, targetUser, roleType}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.SET_ROLE)

	// Get user's role in event, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetEvent)
	for await(const upperUnit of targetEvent.traverse("upperUnits")) {
		if(await user.checkPermission(upperUnit.PERMISSIONS.SET_ROLE)) {
			userRole = null
			break
		}
	}

	// Get role config
	let roleConfig
	if(roleType != "remove") {
		roleConfig = Config.roles[roleType]
		if(!roleConfig) throw new HTTPError(400, "Nieznana funkcja")
	}

	// Ensure current or new role is not higher in rank than user's role
	const targetUserRole = await targetUser.getRoleInUnit(targetEvent)
	if(
		(userRole && roleConfig && roleConfig.rank > userRole.config.rank) ||
		(targetUserRole && userRole && targetUserRole.config.rank > userRole.config.rank)
	) {
		throw new HTTPError(400, "Nie można zmieniać funkcji wyższej niż własna")
	}

	// User can only set their own role if they have a "setRole" role in an upper unit
	if(user.id == targetUser.id && !await user.hasRoleInUnits("setRole", targetEvent.traverse("upperUnits"))) {
		throw new HTTPError(400, "Nie można zmienić własnej funkcji")
	}

	// User can only set public roles, unless they can access event participants
	if(roleConfig && !roleConfig.tags.includes("public") && !await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
		throw new HTTPError(400, "Nie masz uprawnień do nadania tej funkcji")
	}

	const canSetRole = await (async () => {
		// Check if member belongs to the event
		if(targetEvent.participants.hasID(targetUser.id)) {
			// If user cannot access participants, only allow users with roles
			if(targetEvent.roles.find(r => r.user.id == targetUser.id)) return true
			if(await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) return true
		}

		// If user has "manageUser" role in upperUnit, check subMembers of unit
		await targetEvent.populate("upperUnits")
		for(const unit of targetEvent.upperUnits) {
			if(!await user.hasRoleInUnits("manageUser", unit.traverse("upperUnits", {includeSelf: true}))) continue
			if(await unit.listMembers(true).find(u => u.id == targetUser.id)) return true
		}
	})()

	if(!canSetRole) {
		throw new HTTPError(400, "Nie masz uprawnień do nadania funkcji temu użytkownikowi")
	}

	// Remove user
	if(roleType == "remove") {
		const participant = targetEvent.participants.id(targetUser.id)
		await participant.uninvite()

		// Re-calculate approvers if role had "approveEvent" or "manageEvent" tag
		if(targetUserRole?.hasTag("approveEvent") || targetUserRole?.hasTag("manageEvent")) {
			await targetEvent.calculateApprovers()
		}
		
	// Set role
	} else {
		// Invite participant to event
		await targetEvent.inviteParticipant(targetUser, undefined, false)
		
		await targetEvent.setRole(targetUser, roleType)
	}

	await targetEvent.save()

	return {
		roleType
	}
}