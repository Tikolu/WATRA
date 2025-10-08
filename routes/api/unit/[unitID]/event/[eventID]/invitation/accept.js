import HTTPError from "modules/server/error.js"

export default async function({targetEvent, targetInvitation}) {
	// Accept invite
	targetInvitation.state = "accepted"

	await targetEvent.save()

	return {
		invitationState: targetInvitation.state
	}
}