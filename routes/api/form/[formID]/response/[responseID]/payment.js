import Config from "modules/config.js"
import * as datetime from "datetime"
import HTTPError from "modules/server/error.js"

export async function start({user, targetForm, targetResponse}) {
	if(!Config.stripeEnabled) {
		throw new HTTPError(400, "Płatności nie są obsługiwane")
	}
	const { stripeAPI } = await import("modules/integrations/stripe.js")
	
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	// Find payment element
	const paymentElement = targetForm.elements.find(e => e.type == "payment")
	if(!paymentElement) throw new HTTPError(400, "Formularz nie obsługuje płatności")

	// Generate payment reference ID
	const referenceID = `watra_${targetForm.id}_${targetResponse.id}_${targetResponse.user.id}`
	
	// Find value of payment element
	const elementValue = targetResponse.getElement(paymentElement.id) || {}
	if(elementValue.state == "paid") throw new HTTPError(400, "Płatność została już dokonana")
	if(elementValue.id) {
		// Load session details from Stripe
		const stripeSession = await stripeAPI(`checkout/sessions/${elementValue.id}`)
		if(stripeSession.client_reference_id !== referenceID) {
			throw new HTTPError(400, "Nieprawidłowa sesja płatności")
		}

		// Session is completed, update response and return
		if(stripeSession.status == "complete") {
			await targetResponse.updateElement(paymentElement, {
				state: "paid"
			}, false)

			return {
				state: "paid"
			}
		}

		// Session is open, return URL
		else if(stripeSession.status == "open") {
			return {
				url: elementValue.url
			}
		}
	}

	// Load target user
	await targetResponse.populate("user")
	await targetForm.populate("unit")

	// Start Stripe payment process
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
			}
		],
		mode: "payment",
		success_url: `https://${Config.host}/forms/${targetForm.id}/responses/${targetResponse.id}/payment?status=success&session={CHECKOUT_SESSION_ID}`,
		cancel_url: `https://${Config.host}/forms/${targetForm.id}/responses/${targetResponse.id}/payment?status=cancel`,
		allow_promotion_codes: true,
		adaptive_pricing: {
			enabled: false
		},
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