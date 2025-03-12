import HTTPError from "modules/server/error.js"

export function exit() {
	// Redirect to login page
	this.response.redirect("/login")
}