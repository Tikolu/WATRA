import html from "modules/html.js"
import User from "modules/schemas/user.js"

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

export async function open() {
	// Set content type to text/html
	this.response.headers.set("Content-Type", "text/html; charset=utf-8")
	
	// Get user ID from token
	const userID = this.request.token?.user
	
	// If user ID is set, lookup and validate the user
	if(userID) {
		const user = await User.findById(userID)

		if(!user) {
			this.response.redirect("/logout")
			return
		}
		this.addRouteData({user})
	}
}

export function exit({user}) {
	if(!this.response.open) return
	
	if(this.lastError) {
		// Default code for all errors is 500
		const code = this.lastError.httpCode || 500
		// Use error message from error unless it is a default
		let message = errorMessages[code]?.[1] || ""
		if(!this.lastError.defaultMessage) message = this.lastError.message
		this.lastOutput = html("error", {
			error: {
				code,
				title: errorMessages[code]?.[0] || `Error ${code} 🤔`,
				message,
				stack: this.lastError.stack
			}
		})
	}

	// Convert output to string
	if(typeof this.lastOutput != "string") this.lastOutput = String(this.lastOutput)
	
	// Write to this.response and close it
	this.response.write(this.lastOutput)
	this.response.close()
}