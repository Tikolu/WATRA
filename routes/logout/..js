import HTTPError from "modules/server/error.js"

export function open({userID}) {
	if(userID && !/^[a-f0-9]{8}$/.test(userID)) {
		throw new HTTPError(400, "Nie prawidłowy ID użytkownika")
	}
}

export function exit() {
	// Redirect to login page
	this.response.redirect("/login")
}