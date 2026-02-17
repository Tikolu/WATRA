import HTTPError from "modules/server/error.js"
import FormResponse from "modules/schemas/form/response.js"

export async function _open({user, targetForm, responseID}) {
	let targetResponse
	
	if(responseID == "new") {
		// Check permissions
		await user.requirePermission(targetForm.PERMISSIONS.RESPOND)

		// Get user options for submitting
		const userOptions = await targetForm.getResponseUserOptions(user)

		// Create new response and save to DB
		targetResponse = new FormResponse({
			form: targetForm,
			user: userOptions[0]
		})

	} else {
		// Get response from DB, and check if exists
		targetResponse = await FormResponse.findById(responseID)
		if(!targetResponse) throw new HTTPError(404, "Odpowiedź nie istnieje")
		// Check permissions
		await user.requirePermission(targetResponse.PERMISSIONS.ACCESS)

		await targetResponse.populate("form", {known: [targetForm]})
	}

	this.addRouteData({targetResponse})
}

export function _exit({targetResponse}) {
	return {
		responseID: targetResponse.id
	}
}