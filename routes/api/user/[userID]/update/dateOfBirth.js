import * as datetime from "jsr:@std/datetime"

export default async function({user, targetUser, date}) {
	// Update date of birth
	await targetUser.updateDateOfBirth(date)

	// Log event
	await user.logEvent("DOB_UPDATE", {
		targetUser,
		data: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd")
	})

	if(targetUser.dateOfBirth) {
		return {
			date: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd"),
			age: targetUser.age
		}
	}
}