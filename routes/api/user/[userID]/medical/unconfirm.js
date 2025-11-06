export default async function({targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)
	
	await targetUser.medical.unconfirm()
}