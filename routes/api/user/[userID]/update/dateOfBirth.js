import * as datetime from "jsr:@std/datetime"

export default async function({targetUser, date}) {
	targetUser.dateOfBirth = date
	
	await targetUser.save()

	if(targetUser.dateOfBirth) {
		return {
			date: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd"),
			age: targetUser.age
		}
	}
}