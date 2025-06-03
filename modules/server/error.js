const errorMessages = {
	400: "Invalid URL",
	403: "Forbidden",
	404: "Not found",
	500: "Server error"
}

function isValidCode(code) {
	code = Number(code)
	if(isNaN(code)) return false
	if(code < 200) return false
	if(code >= 600) return false
	return true
}

export default class HTTPError extends Error {
	constructor(code=500, message="") {
		// Setup error code
		if(!code) code = 500
		if(!isValidCode(code)) {
			if(message) code += `, ${message}`
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
			stack = stack.split("\n")
			const newStack = []
			for(let line of stack) {
				if(line.includes(" (ext:")) continue
				line = line.replaceAll(SERVER_ROOT, "")
				if(line.includes(" (file:///")) continue
				newStack.push(line)
			}
			this.stack = newStack.join("\n")
		}

		// Change message of Eta debug errors
		if(this.message.includes("Error: html/")) {
			const realMessage = this.stack.match(/\n\n(.*)\n +at/)
			if(realMessage) this.message = realMessage[1]
		}

		// Clean up message
		if(this.message.includes("\n")) this.message = this.message.split("\n")[0]
		this.message = this.message.replaceAll(SERVER_ROOT, "")
	}
}