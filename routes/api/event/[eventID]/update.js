import * as datetime from "jsr:@std/datetime"

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

export async function dates({targetEvent, startDate, endDate}) {
	targetEvent.dates = {
		start: startDate,
		end: endDate
	}
	
	await targetEvent.save()


	return {
		startDate: targetEvent.dates.start ? datetime.format(targetEvent.dates.start, "yyyy-MM-dd") : undefined,
		endDate: targetEvent.dates.end ? datetime.format(targetEvent.dates.end, "yyyy-MM-dd") : undefined,
		type: targetEvent.typeName,
		displayName: targetEvent.displayName
	}
}

export async function location({targetEvent, location}) {	
	targetEvent.location = location

	await targetEvent.save()

	return {
		location: targetEvent.location
	}
}