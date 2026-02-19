import HTTPError from "modules/server/error.js"

export function _open({user, targetForm, targetResponse, elementID}) {
	// Get element from form
	const targetElement = targetForm.elements.id(elementID)
	if(!targetElement) throw new HTTPError(404, "Element nie istnieje")

	this.addRouteData({targetElement})
}

export async function update({user, targetResponse, targetElement, value}) {
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	await targetResponse.updateElement(targetElement, value)

	// Disable logging
	this.logging.disabled = true
}