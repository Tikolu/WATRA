import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetEvent}) {
	await targetEvent.populate({
		"upperUnits": {},
		"invitedUnits": {
			"unit": {},
		}
	})

	// Check all permissions
	await user.checkPermission(targetEvent.PERMISSIONS)

	if(user.hasPermission(targetEvent.PERMISSIONS.PARTICIPANT_ACCESS)) {
		// Populate event roles, users and units of roles, and participants
		await targetEvent.populate({
			"roles": ["user", "unit"],
			"participants": {
				"user": {}
			}
		})

		// Sort roles
		await targetEvent.sortRoles()
	}

	if(user.hasPermission(targetEvent.PERMISSIONS.APPROVE) || user.hasPermission(targetEvent.PERMISSIONS.EDIT)) {
		// Populate event approvers
		await targetEvent.populate({
			"approvers": {
				"role": ["user", "unit"]
			}
		})
	}

	// Check for access to invited units
	for(const unitInvite of targetEvent.invitedUnits || []) {
		if(await user.checkPermission(unitInvite.unit.PERMISSIONS.MANAGE_INVITES)) {
			await targetEvent.populate(
				{"participants": "user"},
				{select: "name"}
			)
		}
	}
	
	// Get participants for approval
	await user.populate("children")
	const approvalParticipants = []
	for(const participant of [user, ...user.children]) {
		// Check if user is invited to event
		const userInvite = targetEvent.findUserInvite(participant)
		if(!userInvite) continue

		await userInvite.populate("user")

		// Check for approval permission
		if(!await user.checkPermission(participant.PERMISSIONS.APPROVE)) continue

		approvalParticipants.push(userInvite)
	}

	return html("event/page", {
		user,
		targetEvent,
		approvalParticipants
	})
}