import Config from "modules/config.js"

const STRIPE_API_KEY = Deno.env.get("STRIPE_API_KEY")
Config.stripeEnabled = !!STRIPE_API_KEY

function objectToFormData(object) {
	const formData = new FormData()

	function appendFormData(key, value) {
		if(typeof value === "object") {
			for(const subKey in value) {
				const formDataKey = key ? `${key}[${subKey}]` : subKey
				appendFormData(formDataKey, value[subKey])
			}
		} else {
			formData.append(key, value)
		}
	}

	appendFormData("", object)
	return new URLSearchParams(formData).toString()
}

export async function stripeAPI(endpoint, data={}, options={}) {
	const fetchOptions = {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${STRIPE_API_KEY}`,
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: objectToFormData(data)
	}

	if(options.idempotency) {
		fetchOptions.headers["Idempotency-Key"] = options.idempotency
	}

	const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, fetchOptions)

	const json = await response.json()
	if(json.error) throw new Error(json.error.message)
	return json
}