import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetJednostka}) {
	// Check if jednostka invited
	if(!targetWyjazd.invitedJednostki.some(invite => invite.jednostka == targetJednostka.id)) {
		throw new HTTPError(400, "Jednostka nie jest zaproszona na wyjazd")
	}
	
	// Uninvite jednostka
	targetWyjazd.invitedJednostki = targetWyjazd.invitedJednostki.filter(invite => invite.jednostka != targetJednostka.id)
	targetJednostka.wyjazdInvites = targetJednostka.wyjazdInvites.filter(id => id != targetWyjazd.id)

	// Remove participants
	targetWyjazd.participants = targetWyjazd.participants.filter(participant => participant.jednostka != targetJednostka.id)

	await targetWyjazd.save()
	await targetJednostka.save()
}