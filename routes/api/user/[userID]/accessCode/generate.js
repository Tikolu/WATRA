export default async function({targetUser}) {
	// Generate access code
	const accessCode = await targetUser.generateAccessCode()

	return { accessCode }
}