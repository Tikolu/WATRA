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
		if(!code) code = 500
		if(!isValidCode(code)) {
			message = code
			code = 500
		}
		let defaultMessage = false
		if(!message) {
			message = errorMessages[code] || errorMessages[500]
			defaultMessage = true
		}

		super(message)
		this.code = code
		if(defaultMessage) this.defaultMessage = true
	}
}