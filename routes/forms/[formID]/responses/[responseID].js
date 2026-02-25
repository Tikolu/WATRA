import FormResponse from "modules/schemas/form/response.js"

import html from "modules/html.js"
import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export async function _open({user, targetForm, responseID}) {
	// Get user options for submitting
	const userOptions = await targetForm.getResponseUserOptions(user)
	
	let targetResponse
	if(responseID == "new") {
		// Check permissions
		if(userOptions.length == 0) throw new HTTPError(403)
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

	await targetResponse.populate("form", {known: [targetForm]})
	await targetResponse.populate("user", {known: userOptions})

	if(!userOptions.hasID(targetResponse.user.id)) userOptions.push(targetResponse.user)
	
	this.addRouteData({targetResponse, userOptions})
}


export default async function({user, targetForm, targetResponse, userOptions}) {
	
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


export async function payment({user, targetForm, targetResponse, status, session}) {
	if(!Config.stripeEnabled) {
		throw new HTTPError(400, "Płatności nie są obsługiwane")
	}
	
	if(targetResponse.id == "new") throw new HTTPError(400, "Odpowiedź nie została jeszcze zapisana")
	
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	// Find payment element
	const paymentElement = targetForm.elements.find(e => e.type == "payment")
	if(!paymentElement) throw new HTTPError(400, "Formularz nie obsługuje płatności")

	// Ensure valid state of payment element
	const elementValue = targetResponse.getElement(paymentElement.id) || {}
	if(elementValue.state == "paid") return this.response.redirect(`/forms/${targetForm.id}?response=${targetResponse.id}`)
	else if(elementValue.state != "pending") throw new HTTPError(400, "Nie rozpoczęto procesu płatności")

	if(status == "success") {
		// Verify session ID
		if(elementValue.id != session) throw new HTTPError(400, "Nieprawidłowy identyfikator sesji płatności")

		// Ensure session exists and relates to this response
		const { stripeAPI } = await import("modules/integrations/stripe.js")
		
		const stripeSession = await stripeAPI(`checkout/sessions/${session}`)
		const referenceID = `watra_${targetForm.id}_${targetResponse.id}_${targetResponse.user.id}`
		if(stripeSession.client_reference_id !== referenceID || stripeSession.status != "complete") {
			throw new HTTPError(400, "Nieprawidłowa sesja płatności")
		}
		
		targetResponse.updateElement(paymentElement, {
			state: "paid"
		}, false)

	} else if(status != "cancel") {
		throw new HTTPError(400, "Nieprawidłowy status płatności")
	}

	return this.response.redirect(`/forms/${targetForm.id}?response=${targetResponse.id}`)
}