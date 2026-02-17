export default async function({user, targetForm}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.DELETE)
	
	await targetForm.delete()
}