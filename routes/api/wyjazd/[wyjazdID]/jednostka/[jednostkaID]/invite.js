import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetJednostka}) {
	// Check if jednostka already invited
	if(targetWyjazd.invitedJednostki.some(invite => invite.jednostka == targetJednostka.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Jednostka została już zaproszona na wyjazd")
	}
	
	// Remove existing invites
	targetWyjazd.invitedJednostki = targetWyjazd.invitedJednostki.filter(invite => invite.jednostka != targetJednostka.id)
	
	// Invite jednostka
	targetWyjazd.invitedJednostki.push({
		jednostka: targetJednostka.id,
		state: "pending"
	}),
	targetJednostka.wyjazdInvites.push(targetWyjazd.id)
	await targetWyjazd.save()
	await targetJednostka.save()
}