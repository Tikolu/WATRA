export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)
	
	await targetUser.medical.unconfirm()
}