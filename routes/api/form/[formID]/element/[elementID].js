import HTTPError from "modules/server/error.js"

export async function _open({user, targetForm, elementID}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.EDIT)

	// Get element from form
	const targetElement = targetForm.elements.id(elementID)
	if(!targetElement) throw new HTTPError(404, "Element nie istnieje")

	this.addRouteData({targetElement})
}

export function update({value, targetElement}) {
	targetElement.value = value
	targetElement.markModified("value")
}

export function remove({targetElement}) {
	targetElement.delete()
}

export async function _exit({targetForm}) {	
	await targetForm.save()

	// Disable logging
	this.logging.disabled = true
}
