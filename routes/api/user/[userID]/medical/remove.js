export default async function({user, targetUser, category, element}) {
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	await targetUser.medical.removeEntry(category, element)
	
	// Disable logging
	this.logging.disabled = true
}