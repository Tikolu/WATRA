import html from "modules/html.js"
import Wyjazd from "modules/schemas/wyjazd.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate({
		"children": {
			"wyjazdInvites": {}
		},
		"funkcje": "jednostka",
		"funkcjeWyjazdowe": "jednostka",
		"wyjazdInvites": {}
	})

	// Check permissions
	await user.checkPermission(Wyjazd.PERMISSIONS.CREATE)
	
	return html("main", { user })
}