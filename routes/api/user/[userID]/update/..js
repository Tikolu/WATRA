export async function open({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
}