import * as datetime from "jsr:@std/datetime"

export default async function({targetEvent, startDate, endDate}) {
	// Update dates
	await targetEvent.updateDates(startDate, endDate)

	return {
		startDate: targetEvent.dates.start ? datetime.format(targetEvent.dates.start, "yyyy-MM-ddTHH:mm") : undefined,
		endDate: targetEvent.dates.end ? datetime.format(targetEvent.dates.end, "yyyy-MM-ddTHH:mm") : undefined,
		type: targetEvent.typeName,
		displayName: targetEvent.displayName
	}
}