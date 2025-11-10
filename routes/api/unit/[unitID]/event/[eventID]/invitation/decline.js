import HTTPError from "modules/server/error.js"

export default async function({targetUnit, targetEvent, targetInvitation}) {
	// Decline invite
	targetInvitation.state = "declined"
	targetInvitation.invitedParticipants = []

	// Remove event from unit.eventInvites
	targetUnit.eventInvites = targetUnit.eventInvites.filter(id => id != targetEvent.id)

	await targetEvent.save()
	await targetUnit.save()

	return {
		invitationState: targetInvitation.state
	}
}