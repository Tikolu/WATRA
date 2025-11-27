export default async function({user, targetUser, category, element="", symptoms="", solutions=""}) {
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	await targetUser.medical.updateEntry(category, element, symptoms, solutions)

	// Disable logging
	this.logging.disabled = true
}