export default async function({user, targetEvent, approvers}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY)

	await targetEvent.setApprovers(approvers)

	return {
		approvers: targetEvent.approvers.map(a => a.funkcja.id)
	}
}