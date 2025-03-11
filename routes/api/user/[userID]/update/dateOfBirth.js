export default async function({targetUser, date}) {
	// Update date of birth
	await targetUser.updateDateOfBirth(date)

	return {
		date: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd"),
		age: targetUser.age
	}
}