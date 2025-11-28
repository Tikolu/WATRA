import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetEvent}) {
	await targetEvent.populate({
		"upperUnits": {},
		"invitedUnits": {
			"unit": {},
		},
		"roles": "user"
	})

	// Check all permissions
	await user.checkPermission(targetEvent.PERMISSIONS)

	if(user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
		// Populate event participants
		await targetEvent.populate({
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

	// Get participants for approving
	const approvalParticipants = []
	for(const participant of [user, ...user.children]) {
		// Check if user is invited to event
		const userInvite = targetEvent.participants.id(participant.id)
		if(!userInvite) continue

		await userInvite.populate("user")

		// Check for approval permission on participant
		await user.checkPermission(userInvite.user.PERMISSIONS.APPROVE)

		approvalParticipants.push(userInvite)
	}

	// Get event files
	const files = []
	const userRoleInEvent = await user.getRoleInUnit(targetEvent)
	for(const file of targetEvent.files) {
		if(!user.hasPermission(targetEvent.PERMISSIONS.EDIT) && !user.hasPermission(targetEvent.PERMISSIONS.APPROVE)) {
			if(file.access == "owner") continue
			else if(file.access == "role" && !userRoleInEvent) continue
		}
		files.push(file)
	}
	await files.populate("file", {ref: "File", select: "name"})

	return html("event/page", {
		user,
		targetEvent,
		approvalParticipants,
		files
	})
}