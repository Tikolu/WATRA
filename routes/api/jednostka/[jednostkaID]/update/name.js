export default async function({user, targetJednostka, name}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Update name
	await targetJednostka.updateName(name)

	return {
		name: targetJednostka.name,
		displayName: targetJednostka.displayName
	}
}