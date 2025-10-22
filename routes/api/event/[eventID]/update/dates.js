import * as datetime from "jsr:@std/datetime"

export default async function({targetEvent, startDate, endDate}) {
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