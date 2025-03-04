export default async function({targetUser, input}) {
	// Update date of birth
	await targetUser.updateDateOfBirth(input.date)
}