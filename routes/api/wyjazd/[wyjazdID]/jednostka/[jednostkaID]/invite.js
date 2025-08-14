import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetJednostka}) {
	// Check if jednostka already invited
	if(targetWyjazd.invitedJednostki.some(invite => invite.jednostka == targetJednostka.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Jednostka została już zaproszona na wyjazd")
	}
	
	await targetWyjazd.inviteJednostka(targetJednostka)
}