import HTTPError from "modules/server/httpError.js"

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

export function exit({response, lastOutput, lastError}) {
	if(lastError) {
		lastOutput = {
			error: {
				code: lastError.code || 500,
				message: lastError.message
			}
		}
		if(lastError.stack) lastOutput.error.stack = lastError.stack.replaceAll(SERVER_ROOT, "").split("\n")
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