import HTTPError from "modules/server/error.js"

export default async function({targetUnit, targetWyjazd, targetInvitation}) {
	// Decline invite
	targetInvitation.state = "declined"
	targetInvitation.invitedUsers = []

	// Remove wyjazd from unit.wyjazdInvites
	targetUnit.wyjazdInvites = targetUnit.wyjazdInvites.filter(id => id != targetWyjazd.id)

	await targetWyjazd.save()
	await targetUnit.save()

	return {
		invitationState: targetInvitation.state
	}
}