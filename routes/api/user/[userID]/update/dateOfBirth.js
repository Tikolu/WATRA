import * as datetime from "jsr:@std/datetime"

export default async function({targetUser, date}) {
	// Update date of birth
	await targetUser.updateDateOfBirth(date)

	if(targetUser.dateOfBirth) {
		return {
			date: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd"),
			age: targetUser.age
		}
	}
}