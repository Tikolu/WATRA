export default async function({user, targetForm, type}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.EDIT)
	
	// Add element
	const element = await targetForm.addElement(type)

	// Disable logging
	this.logging.disabled = true

	return {
		elementID: element.id
	}
}