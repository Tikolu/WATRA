export default async function({user, targetUser, first, last}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)
	
	// Update names
	await targetUser.updateName(first, last)

	return {
		first: targetUser.name.first || "",
		last: targetUser.name.last || "",
		display: targetUser.displayName
	}
}