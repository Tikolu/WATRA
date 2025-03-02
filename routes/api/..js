import HTTPError from "modules/server/error.js"

export async function open({request, response, addRouteData}) {
	response.headers.set("Content-Type", "application/json")

	let input = ""
	if(request.method == "POST") input = await request.getBody()

	try {
		if(input === "") input = {}
		else input = JSON.parse(input)
	} catch {
		throw new HTTPError(400, "Invalid JSON")
	}

	addRouteData({input})
}

function removeANSI(text) {
	if(!text || typeof text != "string") return
	return text.replaceAll(/\u001b\[[0-9]+m/g, "")
}

export function exit({response, lastOutput, lastError}) {
	if(lastError) {
		lastOutput = {
			error: {
				code: lastError.httpCode || 500,
				message: removeANSI(lastError.message),
				stack: removeANSI(lastError.stack).split("\n")
			}
		}
		lastError.clear()
	}

	lastOutput ||= {}

	if(typeof lastOutput == "object") {
		try {
			lastOutput = JSON.stringify(lastOutput)
		} catch {
			response.statusCode = 500
			lastOutput = JSON.stringify({
				error: {
					code: 500,
					message: "Failed to generate API output",
				}
			})
		}
	}

	return lastOutput
}