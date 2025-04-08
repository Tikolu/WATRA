import * as datetime from "jsr:@std/datetime"

export default async function({targetWyjazd, startDate, endDate}) {
	// Update dates
	await targetWyjazd.updateDates(startDate, endDate)

	return {
		startDate: targetWyjazd.dates.start ? datetime.format(targetWyjazd.dates.start, "yyyy-MM-ddTHH:mm") : undefined,
		endDate: targetWyjazd.dates.end ? datetime.format(targetWyjazd.dates.end, "yyyy-MM-ddTHH:mm") : undefined,
		type: targetWyjazd.typeName,
		displayName: targetWyjazd.displayName
	}
}