import HTTPError from "modules/server/error.js"

export async function open() {
	this.response.headers.set("Content-Type", "application/json")

	let input = ""
	if(this.request.method == "POST") input = await this.request.getBody()

	try {
		if(input === "") input = {}
		else input = JSON.parse(input)
	} catch {
		throw new HTTPError(400, "Invalid JSON")
	}

	if(typeof input != "object") throw new HTTPError(400, "Invalid input data")
	this.addRouteData(input)
}

function removeANSI(text) {
	if(!text || typeof text != "string") return
	return text.replaceAll(/\u001b\[[0-9]+m/g, "")
}

export function exit() {
	if(this.lastError) {
		if(this.lastError.defaultMessage) {
			if(this.lastError.httpCode == 400) this.lastError.message = "Invalid request"
			if(this.lastError.httpCode == 404) this.lastError.message = "API not found"
		}
		
		this.lastOutput = {
			error: {
				code: this.lastError.httpCode || 500,
				message: removeANSI(this.lastError.message),
				stack: removeANSI(this.lastError.stack).split("\n")
			}
		}
		this.lastError.clear()
	}

	this.lastOutput ||= {}

	if(typeof this.lastOutput == "object") {
		try {
			this.lastOutput = JSON.stringify(this.lastOutput)
		} catch {
			this.response.statusCode = 500
			this.lastOutput = JSON.stringify({
				error: {
					code: 500,
					message: "Failed to generate API output",
				}
			})
		}
	}

	return this.lastOutput
}