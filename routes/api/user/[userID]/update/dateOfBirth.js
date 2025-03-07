export default async function({targetUser, date}) {
	// Update date of birth
	await targetUser.updateDateOfBirth(date)
}