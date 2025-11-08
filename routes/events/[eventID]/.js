import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetEvent}) {
	await targetEvent.populate({
		"invitedUnits": {
			"unit": {},
		}
	})

	// Check permissions for invited units
	for(const unitInvite of targetEvent.invitedUnits) {
		await user.checkPermission(unitInvite.unit.PERMISSIONS.MODIFY)
	}

	// Check for participant access permission
	if(await user.checkPermission(targetEvent.PERMISSIONS.PARTICIPANT_ACCESS)) {
		// Populate event roles, as well as users and units of roles
		await targetEvent.populate({
			"roles": ["user", "unit"],
			"invitedUnits": {
				"invitedUsers": {
					"user": {}
				}
			}
		})

		// Sort roles
		await targetEvent.sortRoles()

	}

	// Check for event modify permission	
	if(await user.checkPermission(targetEvent.PERMISSIONS.MODIFY)) {
		// Load approver data
		await targetEvent.populate({
			"approvers": {
				"role": ["user", "unit"]
			}
		})

	}

	if(
		await user.checkPermission(targetEvent.PERMISSIONS.APPROVE) ||
		await user.checkPermission(targetEvent.PERMISSIONS.MODIFY)
	) {
		// Load approver data
		await targetEvent.populate({
			"approvers": {
				"role": ["user", "unit"]
			}
		})
	}


	// Check for access to invited units
	for(const unitInvite of targetEvent.invitedUnits || []) {
		await user.checkPermission(unitInvite.unit.PERMISSIONS.MODIFY)
	}
	
	// Get participants for approval
	await user.populate("children")
	const participantOptions = [user, ...user.children]
	
	const approvalParticipants = []
	for(const participant of participantOptions) {
		// Check if user is invited to event
		const userInvite = targetEvent.findUserInvite(participant)
		if(!userInvite) continue

		await userInvite.populate("user")

		// Check for approval permission
		if(!await user.checkPermission(participant.PERMISSIONS.APPROVE)) continue

		approvalParticipants.push(userInvite)
	}

	// Check permissions for invited units
	for(const unitInvite of targetEvent.invitedUnits) {
		await user.checkPermission(unitInvite.unit.PERMISSIONS.MODIFY)
	}
	
	return html("event/page", {
		user,
		targetEvent,
		approvalParticipants
	})
}