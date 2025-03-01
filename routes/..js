import html from "modules/html.js"

const errorMessages = {
	400: ["Invalid URL 😳", "Your URL does not make much sense to the server"],
	403: ["Forbidden 😑", "You are not allowed to access this resource"],
	404: ["Not found 😭", "The requested resource does not exist on the server"],
	500: ["Internal server error 💀", "Something went wrong on the server"]
}

export async function open({request, response, addRouteData}) {
	// If a cookie header is present, parse cookies
	if(request.headers.has("Cookie")) {
		request.getCookies()
		// If a token cookie is present, parse token
		if(request.cookies.token) await request.parseToken()
	}
	// Add token to route data
	addRouteData({token: request.token})
	// Set content type to text/html
	response.headers.set("Content-Type", "text/html; charset=utf-8")
}

export async function exit({response, lastOutput, lastError}) {
	if(!response.open) return
	
	if(lastError) {
		// Default code for all errors is 500
		const code = lastError.code || 500
		let stack
		if(lastError.stack) {
			stack = lastError.stack?.replaceAll(SERVER_ROOT, "")
		}
		// Use error message from error unless it is a default
		let message = errorMessages[code]?.[1] || ""
		if(!lastError.defaultMessage) message = lastError.message
		lastOutput = html("error", {
			error: {
				code,
				title: errorMessages[code]?.[0] || `Error ${code} 🤔`,
				message,
				stack
			}
		})
	}

	// Send the token, if one is present
	if(response.token) await response.sendToken()
	// Convert output to string
	if(typeof lastOutput != "string") lastOutput = String(lastOutput)
	
	// Write to response and close it
	response.write(lastOutput)
	response.close()
}