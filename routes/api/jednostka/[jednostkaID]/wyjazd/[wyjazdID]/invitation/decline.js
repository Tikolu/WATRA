import HTTPError from "modules/server/error.js"

export default async function({targetJednostka, targetWyjazd, targetInvitation}) {
	// Decline invite
	targetInvitation.state = "declined"
	targetInvitation.invitedUsers = []

	// Remove wyjazd from jednostka.wyjazdInvites
	targetJednostka.wyjazdInvites = targetJednostka.wyjazdInvites.filter(id => id != targetWyjazd.id)

	await targetWyjazd.save()
	await targetJednostka.save()
}