import Config from "modules/config.js"
import * as datetime from "jsr:@std/datetime"
import HTTPError from "modules/server/error.js"

export async function start({user, targetForm, targetResponse}) {
	if(!Config.stripeEnabled) {
		throw new HTTPError(400, "Płatności nie są obsługiwane")
	}
	
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	// Find payment element
	const paymentElement = targetForm.elements.find(e => e.type == "payment")
	if(!paymentElement) throw new HTTPError(400, "Formularz nie obsługuje płatności")

	// Find value of payment element
	const elementValue = targetResponse.getElement(paymentElement.id) || {}
	if(elementValue.state == "paid") throw new HTTPError(400, "Płatność została już dokonana")
	if(elementValue.url && elementValue?.expires > new Date()) {
		return {
			url: elementValue.url
		}
	}

	// Load target user
	await targetResponse.populate("user")
	await targetForm.populate("unit")

	// Start Stripe payment process
	const referenceID = `watra_${targetForm.id}_${targetResponse.id}_${targetResponse.user.id}`
	const stripeOptions = {
		client_reference_id: referenceID,
		line_items: [
			{
				price_data: {
					product_data: {
						name: targetForm.displayName,
						description: targetResponse.user.displayName
					},
					currency: Config.paymentCurrency,
					unit_amount: paymentElement.value * 100
				},
				quantity: 1
			},
		],
		mode: "payment",
		success_url: `https://${Config.host}/forms/${targetForm.id}/responses/${targetResponse.id}/payment?status=success&session={CHECKOUT_SESSION_ID}`,
		cancel_url: `https://${Config.host}/forms/${targetForm.id}/responses/${targetResponse.id}/payment?status=cancel`,
		payment_intent_data: {
			description: `${targetResponse.user.displayName} - ${targetForm.displayName}`,
			metadata: {
				"Form": `${targetForm.displayName} (${targetForm.id})`,
				"Response": `${datetime.format(targetResponse.date, "dd/MM/yyyy")} (${targetResponse.id})`,
				"Unit": `${targetForm.unit.displayName} (${targetForm.unit.id})`,
				"User (paying)": `${user.displayName} (${user.id})`,
				"User (target)": `${targetResponse.user.displayName} (${targetResponse.user.id})`
			},
		}
	}

	if(user.email) stripeOptions.customer_email = user.email

	const { stripeAPI } = await import("modules/integrations/stripe.js")

	const response = await stripeAPI("checkout/sessions", stripeOptions)

	// Save URL and expiration date to payment element
	await targetResponse.updateElement(paymentElement, {
		state: "pending",
		id: response.id,
		url: response.url,
		expires: new Date(response.expires_at * 1000)
	}, false)
	
	// Prevent logging of payment details
	this.logging.noOutput = true
	
	return {
		url: response.url
	}
}