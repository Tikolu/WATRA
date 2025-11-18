export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	// Generate access code
	const accessCode = await targetUser.auth.generateAccessCode()

	// Prevent logging of access code
	this.logging.noOutput = true

	return {
		accessCode
	}
}