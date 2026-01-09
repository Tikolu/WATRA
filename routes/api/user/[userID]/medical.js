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

export async function confirm({user, targetUser, signature}) {
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)

	// Verify signature
	await user.verifySignature(signature)

	await targetUser.medical.confirm(signature)
	
	return targetUser.medical.entries.map(e => [e.title, e.symptoms, e.solutions])
}

export async function unconfirm({user, targetUser}) {
	// Check permissions
	if(!await user.checkPermission(targetUser.PERMISSIONS.APPROVE) && !await user.checkPermission(targetUser.PERMISSIONS.MANAGE)) {
		throw new HTTPError(403)
	}
	
	await targetUser.medical.unconfirm()
}