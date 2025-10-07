export default async function({user, targetUnit, name}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Update name
	await targetUnit.updateName(name)

	return {
		name: targetUnit.name,
		displayName: targetUnit.displayName
	}
}