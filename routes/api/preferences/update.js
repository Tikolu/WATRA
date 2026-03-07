import HTTPError from "modules/server/error.js"

export function _open({user}) {
	if(!user) throw new HTTPError(403)

	user.preferences ||= {}
}

export async function _exit({user}) {
	// Save user
	await user.save()

	// Disable logging
	this.logging.disabled = true
}


const themes = ["auto", "light", "dark"]

export function theme({user, theme}) {
	// Check if theme is valid
	if(!themes.includes(theme)) throw new HTTPError(400)

	// Save theme
	user.preferences.theme = theme == "auto" ? undefined : theme
}