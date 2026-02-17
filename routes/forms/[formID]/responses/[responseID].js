import FormResponse from "modules/schemas/form/response.js"

import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetForm, responseID}) {

	// Get user options for submitting
	const userOptions = await targetForm.getResponseUserOptions(user)
	
	let targetResponse
	if(responseID == "new") {
		// Check permissions
		await user.requirePermission(targetForm.PERMISSIONS.RESPOND)
		
		// Create new response and save to DB
		targetResponse = new FormResponse({
			_id: "new",
			form: targetForm,
			user: userOptions[0]
		})

	} else {
		// Get response from DB, and check if exists
		targetResponse = await FormResponse.findById(responseID)
		if(!targetResponse) throw new HTTPError(404, "Odpowiedź nie istnieje")
	}
	
	this.addRouteData({targetResponse})

	await targetResponse.populate("form", {known: [targetForm]})
	await targetResponse.populate("user", {known: userOptions})
	
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.ACCESS)
	await user.checkPermission(targetResponse.PERMISSIONS.EDIT)
	await user.checkPermission(targetResponse.PERMISSIONS.SUBMIT)

	return html("form/response", {
		user,
		targetForm,
		targetResponse,
		userOptions
	})
}