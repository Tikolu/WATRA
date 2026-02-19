import HTTPError from "modules/server/error.js"

export default async function({user, targetForm, targetResponse, responseUser}) {
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	if(Config.stripeEnabled) {
		// Ensure payment has not been started
		const { stripeAPI } = await import("modules/integrations/stripe.js")

		const paymentElement = targetForm.elements.find(e => e.type == "payment")
		const elementValue = targetResponse.getElement(paymentElement.id) || {}
		if(elementValue.state == "paid") throw new HTTPError(400, "Nie można zmienić użytkownika po opłaceniu formularza")
		else if(elementValue.state == "pending") {
			// Expire the payment if it is still pending
			if(elementValue.expires > new Date()) {
				await stripeAPI(`checkout/sessions/${elementValue.id}/expire`)
			}
			// Remove payment data from response
			await targetResponse.updateElement(paymentElement, {}, false)
		}
	}

	// Check user access
	const userOptions = await targetForm.getResponseUserOptions(user)
	if(!userOptions.hasID(responseUser)) throw new HTTPError(403)

	// Set response user
	targetResponse.user = responseUser.id
	await targetResponse.save()

	// Disable logging
	this.logging.disabled = true
}