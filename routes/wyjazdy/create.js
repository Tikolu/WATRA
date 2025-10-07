import Wyjazd from "modules/schemas/wyjazd.js"
import html from "modules/html.js"

export default async function({user}) {
	// Check permission
	await user.requirePermission(Wyjazd.PERMISSIONS.CREATE)

	return html("wyjazd/create", {
		user
	})
}