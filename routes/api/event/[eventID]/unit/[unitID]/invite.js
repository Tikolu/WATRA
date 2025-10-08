import HTTPError from "modules/server/error.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetEvent, targetUnit}) {
	// Check if unit already invited
	if(targetEvent.invitedUnits.some(invite => invite.unit == targetUnit.id && (invite.state == "pending" || invite.state == "accepted"))) {
		throw new HTTPError(400, "Jednostka została już zaproszona na akcję")
	}
	
	// Automatically accept invite if user has funkcja in unit
	let state = "pending"
	const funkcjaInUnit = await user.getFunkcjaInUnit(targetUnit)
	if(funkcjaInUnit?.type >= FunkcjaType.DRUŻYNOWY) {
		state = "accepted"
	}
	
	await targetEvent.inviteUnit(targetUnit, state)

	return {
		invitationState: state
	}
}