import html from "modules/html.js"
import HTTPError from "modules/server/error.js"


export default async function({user, targetUnit, targetEvent, targetInvitation}) {
	// Check unit invitation state
	if(targetInvitation.state != "accepted") throw new HTTPError("Zaproszenie jednostki na akcję nie zostało zaakceptowane")

	// Get all direct members
	const members = {}
	const directMembers = await targetUnit.getMembers()
	if(directMembers.length) members[""] = directMembers
	// Get all subMembers of subUnits
	await targetUnit.populate("subUnits")
	for(const unit of targetUnit.subUnits) {
		const subMembers = await Array.fromAsync(unit.getSubMembers())
		members[unit.displayName] = subMembers
	}

	return html("unit/chooseEventParticipants", {
		user,
		targetUnit,
		targetEvent,
		targetInvitation,
		members
	})
}