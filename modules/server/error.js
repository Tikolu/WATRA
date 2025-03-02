const errorMessages = {
	400: "Invalid URL",
	403: "Forbidden",
	404: "Not found",
	500: "Server error"
}

function isValidCode(code) {
	code = Number(code)
	if(isNaN(code)) return false
	if(code < 100) return false
	if(code >= 600) return false
	return true
}

export default class HTTPError extends Error {
	constructor(code=500, message="") {
		// Setup error code
		if(!code) code = 500
		if(!isValidCode(code)) {
			message = code
			code = 500
		}

		// Setup error message
		let defaultMessage = false
		if(!message) {
			message = errorMessages[code] || errorMessages[500]
			defaultMessage = true
		}
		
		super(message)

		this.httpCode = code
		if(defaultMessage) this.defaultMessage = true

		// Clean up stack trace
		let stack = super.stack || message.stack || this.stack
		if(stack) {
			stack = stack.replaceAll(SERVER_ROOT, "")
			this.stack = stack
		}

		// Clean up message
		if(this.message.includes("\n")) this.message = this.message.split("\n")[0]
		this.message = this.message.replaceAll(SERVER_ROOT, "")
	}
}