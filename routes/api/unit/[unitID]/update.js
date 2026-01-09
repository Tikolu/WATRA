export async function name({user, targetUnit, name}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.EDIT)
	
	// Update name
	targetUnit.name = name
	await targetUnit.save()

	return {
		name: targetUnit.name,
		displayName: targetUnit.displayName
	}
}