import * as datetime from "datetime"

export async function _open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	// Remove any approvals of the event
	for(const approver of targetEvent.approvers) {
		approver.approvedAt = undefined
	}
}

export async function name({targetEvent, name}) {	
	targetEvent.name = name
	
	await targetEvent.save()

	return {
		name: targetEvent.name,
		displayName: targetEvent.displayName
	}
}

export async function description({targetEvent, description}) {	
	targetEvent.description = description

	await targetEvent.save()

	return {
		description: targetEvent.description
	}
}

export async function dates({targetEvent, startDate, startTime, endDate, endTime}) {
	targetEvent.dates = {
		start: new Date(`${startDate} ${startTime || "00:00"}`),
		end: new Date(`${endDate} ${endTime || "00:00"}`)
	}
	
	await targetEvent.save()


	return {
		startDate: targetEvent.dates.start ? formatDate(targetEvent.dates.start) : undefined,
		endDate: targetEvent.dates.end ? formatDate(targetEvent.dates.end) : undefined
	}
}

export async function location({targetEvent, location}) {	
	targetEvent.location = location

	await targetEvent.save()

	return {
		location: targetEvent.location
	}
}

export async function limits({targetEvent, total, perUnit}) {
	total ||= undefined
	perUnit ||= undefined
	
	targetEvent.limit = {total, perUnit}
	await targetEvent.save()

	return {
		limits: targetEvent.limit
	}
}