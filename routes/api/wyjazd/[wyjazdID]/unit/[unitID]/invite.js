import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetUnit}) {
	// Check if unit already invited
	if(targetWyjazd.invitedUnits.some(invite => invite.unit == targetUnit.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Unit została już zaproszona na wyjazd")
	}
	
	await targetWyjazd.inviteUnit(targetUnit)
}