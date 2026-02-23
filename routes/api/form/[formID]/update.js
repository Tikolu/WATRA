export async function name({user, targetForm, name}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.EDIT)

	targetForm.name = name
	
	await targetForm.save()

	return {
		name: targetForm.name,
		displayName: targetForm.displayName
	}
}

export async function config({user, targetForm, enabled, multipleResponses, requireResponse}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.CONFIG)

	targetForm.config = {
		enabled,
		multipleResponses,
		requireResponse
	}
	
	await targetForm.save()

	return targetForm.config
}

export async function targetGroup({user, targetForm, mode, userIDs}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.CONFIG)
	
	const users = Array.create(userIDs).unique()
	
	targetForm.targetGroup = {
		mode,
		users
	}

	await targetForm.save()

	return targetForm.targetGroup
}