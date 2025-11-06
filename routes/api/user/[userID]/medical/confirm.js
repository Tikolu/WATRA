export default async function({user, targetUser}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)

	await targetUser.medical.confirm()
	
	return targetUser.medical.entries.map(e => [e.title, e.symptoms, e.solutions])
}