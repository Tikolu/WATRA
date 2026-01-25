import HTTPError from "modules/server/error.js"

export async function _open() {
	this.response.headers.set("Content-Type", "application/json")
	this.logging = {}

	let input = ""
	if(this.request.method == "POST") {
		input = await this.request.getBody()
	} else if(!this.routePath.equals(["api", "stream"])) {
		throw new HTTPError(405, "Only POST method is allowed")
	}

	try {
		if(input === "") input = {}
		else input = JSON.parse(input)
	} catch {
		throw new HTTPError(400, "Invalid JSON")
	}

	if(typeof input != "object") throw new HTTPError(400, "Invalid input data")
	this.addRouteData(input, false)
}

function removeANSI(text) {
	if(!text || typeof text != "string") return
	return text.replaceAll(/\u001b\[[0-9]+m/g, "")
}

export async function _exit({user}) {
	
	if(this.lastError) {
		if(this.lastError.defaultMessage) {
			if(this.lastError.httpCode == 400) this.lastError.message = "Invalid request"
			if(this.lastError.httpCode == 403) this.lastError.message = "Odmowa dostępu"
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

	let output = this.lastOutput
	if(user && user.logEvent && !this.logging.disabled) {
		await user.logEvent(decodeURI(this.request.address.pathname).replace(/^\/api\//, ""), {
			targetUser: this.routeData.targetUser,
			targetUnit: this.routeData.targetUnit,
			targetEvent: this.routeData.targetEvent,
			data: this.logging.noOutput ? undefined : output
		})
	}

	output ||= {}

	if(typeof output != "object") {
		output = {
			data: output
		}
	}
		
	try {
		output = JSON.stringify(output)
	} catch {
		this.response.statusCode = 500
		output = JSON.stringify({
			error: {
				code: 500,
				message: "Failed to generate API output",
			}
		})
	}

	return output
}

export default function() {
	throw new HTTPError(404, "No API endpoint specified")
}