export async function open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	// Remove any approvals of the event
	for(const approver of targetEvent.approvers) {
		approver.approvedAt = undefined
	}
}