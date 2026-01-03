export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.GENERATE_ACCESS_CODE)
	
	// Generate access code
	const accessCode = await targetUser.auth.generateAccessCode(1000 * 60 * 5)

	// Prevent logging of access code
	this.logging.noOutput = true

	return {
		accessCode
	}
}