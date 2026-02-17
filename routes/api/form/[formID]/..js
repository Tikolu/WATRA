import HTTPError from "modules/server/error.js"
import Form from "modules/schemas/form"

export async function _open({user, formID}) {
	// Get form from DB, and check if exists
	const targetForm = await Form.findById(formID)
	if(!targetForm) throw new HTTPError(404, "Formularz nie istnieje")

	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.ACCESS)

	this.addRouteData({targetForm})
}