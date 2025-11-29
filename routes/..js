import html from "modules/html.js"

import Session from "modules/session.js"
import User from "modules/schemas/user"

const errorMessages = {
	400: ["Nieprawidłowy URL 😳", "Wpisany przez ciebie URL nie ma sensu"],
	403: ["Brak dostępu 🚫", "Nie masz dostępu do tej strony"],
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

	// Add route data from URL parameters
	this.addRouteData(Object.fromEntries(this.request.address.searchParams), false)
	
	// Initialise session
	this.token = this.request.token
	this.session = new Session(this.token)
	
	// Get active user from session
	const user = await this.session.getActiveUser()
	if(user) {
		this.addRouteData({user})
	}
}

export function exit({user}) {
	if(!this.response.open) return
	
	if(this.lastError) {
		// Default code for all errors is 500
		const code = this.lastError.httpCode || 500
		// Redirect 404 errors to login page
		if(code == 404 && !user && this.routePath[0] != "login") {
			this.response.redirect("/login")
			return
		}
		// Use error message from error unless it is a default
		let message = errorMessages[code]?.[1] || ""
		if(!this.lastError.defaultMessage) message = this.lastError.message

		this.lastOutput = html("error", {
			error: {
				code,
				title: errorMessages[code]?.[0] || "🤔",
				message,
				stack: this.lastError.stack
			},
			ip: this.request.headers.get("x-forwarded-for"),
			path: this.request.address.pathname,
			client: this.token.client,
			userAgent: this.request.headers.get("user-agent"),
			user
		})
	}

	// Convert output to string
	if(typeof this.lastOutput != "string") this.lastOutput = String(this.lastOutput)
	
	// Write to response and close it
	this.response.write(this.lastOutput)
	this.response.close()
}