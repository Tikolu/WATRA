import HTTPError from "modules/server/error.js"

export default async function({targetUnit, targetEvent, targetInvitation}) {
	// Cannot decline if participants
	if(targetInvitation.invitedParticipants.filter(p => p.state == "accepted").length > 0) {
		throw new HTTPError(400, "Nie można odrzucić zaproszenia z uczestnikami")
	}
	
	// Decline invite
	targetInvitation.state = "declined"
	await targetInvitation.setParticipants([])

	// Remove event from unit.eventInvites
	targetUnit.eventInvites = targetUnit.eventInvites.filter(id => id != targetEvent.id)

	await targetEvent.save()
	await targetUnit.save()

	return {
		invitationState: targetInvitation.state
	}
}