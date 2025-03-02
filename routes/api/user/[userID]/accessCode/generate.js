export default async function({targetUser}) {
	// Generate access code
	const accessCode = targetUser.generateAccessCode()
	// Save user to DB
	await targetUser.save()

	return { accessCode }
}