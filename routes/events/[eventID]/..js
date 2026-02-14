import html from "modules/html.js"
import Config from "modules/config.js"
import Event from "modules/schemas/event"
import HTTPError from "modules/server/error.js"

export async function _open({user, eventID}) {
	// Get event from DB, and check if exists
	const targetEvent = await Event.findById(eventID)
	if(!targetEvent) throw new HTTPError(404, "Akcja nie istnieje")

	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.ACCESS, "Nie masz dostępu do tej akcji")

	this.addRouteData({targetEvent})
}

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

	// Check for access to invited units
	for(const unitInvite of targetEvent.invitedUnits || []) {
		if(await user.checkPermission(unitInvite.unit.PERMISSIONS.MANAGE_INVITES)) {
			await targetEvent.populate(
				{"participants": "user"},
				{select: "name"}
			)
		}
	}

	// Check permissions on upper units
	for(const upperUnit of targetEvent.upperUnits || []) {
		await user.checkPermission(upperUnit.PERMISSIONS.ACCESS_EVENTS)
	}

	if(
		user.hasPermission(targetEvent.PERMISSIONS.APPROVE) ||
		user.hasPermission(targetEvent.PERMISSIONS.EDIT) ||
		targetEvent.upperUnits.some(u => user.hasPermission(u.PERMISSIONS.ACCESS_EVENTS))
	) {
		// Populate event approvers
		await targetEvent.populate({
			"approvers": {
				"role": ["user", "unit"]
			}
		})
	}

	// Get participants for approving
	const approvalParticipants = []
	for(const participant of [user, ...user.children]) {
		// Check if user is invited to event
		const userInvite = targetEvent.participants.id(participant.id)
		if(!userInvite) continue

		// Skip if registration is closed and user has not accepted yet
		if(userInvite.state == "pending" && !targetEvent.registrationOpen) continue

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

	return html("event/page/main", {
		user,
		targetEvent,
		approvalParticipants,
		files
	})
}