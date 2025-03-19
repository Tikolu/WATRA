export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)
	
	// Generate access code
	const accessCode = await targetUser.generateAccessCode()

	return { accessCode }
}