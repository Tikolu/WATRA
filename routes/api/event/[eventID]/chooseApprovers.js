export default async function({user, targetEvent, approvers}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	await targetEvent.setApprovers(approvers)

	return {
		approvers: targetEvent.approvers.map(a => a.role.id)
	}
}