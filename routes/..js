import html from "modules/html.js"

const errorMessages = {
	400: ["Nieprawidłowy URL 😳", "Wpisany przez ciebie URL nie ma sensu"],
	403: ["Zabronione 😑", "Nie masz dostępu do tej strony"],
	404: ["Nie znaleziono 😭", "Ta strona nie istnieje"],
	500: ["Błąd serwera 💀", "Coś poszło nie tak"]
}

// const errorMessages = {
// 	400: ["Invalid URL 😳", "Your URL does not make much sense to the server"],
// 	403: ["Forbidden 😑", "You are not allowed to access this resource"],
// 	404: ["Not found 😭", "The requested resource does not exist on the server"],
// 	500: ["Internal server error 💀", "Something went wrong on the server"]
// }

export function open({response}) {
	// Set content type to text/html
	response.headers.set("Content-Type", "text/html; charset=utf-8")
}

export function exit({response, lastOutput, lastError}) {
	if(!response.open) return
	
	if(lastError) {
		// Default code for all errors is 500
		const code = lastError.httpCode || 500
		// Use error message from error unless it is a default
		let message = errorMessages[code]?.[1] || ""
		if(!lastError.defaultMessage) message = lastError.message
		lastOutput = html("error", {
			error: {
				code,
				title: errorMessages[code]?.[0] || `Error ${code} 🤔`,
				message,
				stack: lastError.stack
			}
		})
	}

	// Convert output to string
	if(typeof lastOutput != "string") lastOutput = String(lastOutput)
	
	// Write to response and close it
	response.write(lastOutput)
	response.close()
}