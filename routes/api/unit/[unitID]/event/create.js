import HTTPError from "modules/server/error.js"

import Event from "modules/schemas/event"
import Config from "modules/config.js"

export default async function({user, targetUnit, name, startDate, endDate}) {
	if(!user) throw new HTTPError(403)
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_EVENT)
	
	const event = new Event({
		name,
		dates: {
			start: startDate,
			end: endDate
		}
	})

	targetUnit.events.push(event.id)
	event.upperUnits.push(targetUnit.id)

	// Automatically invite unit
	if(targetUnit.config.eventRules.invite) {
		await event.inviteUnit(targetUnit, "accepted")
	}

	// Automatically set user role
	await event.inviteParticipant(user, undefined, false)
	await event.setRole(user, Config.event.creatorRole, false)

	// Calculate event approvers
	await event.calculateApprovers()

	// Save
	await event.save()
	await targetUnit.save()

	return {
		eventID: event.id
	}
}