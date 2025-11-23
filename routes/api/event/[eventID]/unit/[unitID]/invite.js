import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetEvent, targetUnit}) {
	// Check if unit already invited
	if(targetEvent.invitedUnits.some(invite => invite.unit == targetUnit.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Jednostka została już zaproszona na akcję")
	}
	
	// Automatically accept invite if user has permission, and is a direct unit member
	let state = "pending"
	if(await user.checkPermission(targetUnit.PERMISSIONS.MANAGE_INVITES) && await user.getRoleInUnit(targetUnit)) {
		state = "accepted"
	}
	
	await targetEvent.inviteUnit(targetUnit, state)

	return {
		invitationState: state
	}
}