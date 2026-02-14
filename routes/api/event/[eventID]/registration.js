export async function _open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
}

export async function enable({user, targetEvent}) {
	await targetEvent.setRegistrationState(true)
}

export async function disable({user, targetEvent}) {
	await targetEvent.setRegistrationState(false)
}