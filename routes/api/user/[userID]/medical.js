import HTTPError from "modules/server/error.js"

export async function add({user, targetUser, category, element="", symptoms="", solutions=""}) {
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	await targetUser.medical.updateEntry(category, element, symptoms, solutions)

	// Disable logging
	this.logging.disabled = true
}

export async function update({user, targetUser, category, element, symptoms, solutions}) {
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	await targetUser.medical.updateEntry(category, element, symptoms, solutions)
	
	// Disable logging
	this.logging.disabled = true
}

export async function remove({user, targetUser, category, element}) {
	await user.requirePermission(targetUser.PERMISSIONS.EDIT)
	
	await targetUser.medical.removeEntry(category, element)
	
	// Disable logging
	this.logging.disabled = true
}