import HTTPError from "modules/server/error.js"

export default async function({targetWyjazd, targetInvitation}) {
	// Accept invite
	targetInvitation.state = "accepted"

	await targetWyjazd.save()

	return {
		invitationState: targetInvitation.state
	}
}