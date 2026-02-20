import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, unit, state}) {
	// Load units
	await targetEvent.populate({
		"invitedUnits": "unit"
	})

	// List unit options
	const unitOptions = []
	for(const invitedUnit of targetEvent.invitedUnits) {
		if(	!await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS) &&
			!await user.checkPermission(invitedUnit.unit.PERMISSIONS.MANAGE_INVITES)) continue
		unitOptions.push(invitedUnit.unit)
	}

	// Ensure chosen unit is in options
	if(unit && !unitOptions.hasID(unit.id)) throw new HTTPError(403, "Brak dostępu do tej jednostki")

	// Load participants
	const participants = targetEvent.participants.filter(p => {
		if(unit && p.originUnit?.id != unit.id) return false
		if(state && p.state != state) return false
		if(!user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS) && !unitOptions.hasID(p.originUnit?.id)) return false
		return true
	})
	await participants.populate(
		["user", "originUnit"],
		{known: unitOptions}
	)

	// Sort participants by name
	participants.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName))

	return html("event/participantList", {
		user,
		targetEvent,
		unitOptions,
		participants
	})
}