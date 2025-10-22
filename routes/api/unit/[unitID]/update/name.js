export default async function({user, targetUnit, name}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE)
	
	// Update name
	targetUnit.name = name
	await targetUnit.save()

	return {
		name: targetUnit.name,
		displayName: targetUnit.displayName
	}
}