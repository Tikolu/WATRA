import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUnit}) {
	// Check if unit already invited
	if(targetEvent.invitedUnits.some(invite => invite.unit == targetUnit.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Jednostka została już zaproszona na akcję")
	}
	
	await targetEvent.inviteUnit(targetUnit)
}