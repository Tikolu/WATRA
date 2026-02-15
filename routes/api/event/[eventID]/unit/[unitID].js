import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit"
import Config from "modules/config.js"

export async function _open({user, targetEvent, unitID}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Ensure event has not started
	if(targetEvent.isPast) throw new HTTPError(400, "Akcja już się odbyła")

	this.addRouteData({targetUnit})
}

export async function invite({user, targetEvent, targetUnit}) {
	// Check event details
	if(targetEvent.missingDetails.length > 0) {
		throw new HTTPError(400, "Uzupełnij szczegóły akcji, aby zaprosić jednostki")
	}
	
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

export async function uninvite({user, targetEvent, targetUnit}) {
	await targetEvent.uninviteUnit(targetUnit)
}