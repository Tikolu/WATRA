import html from "modules/html.js"
import Wyjazd from "modules/schemas/wyjazd.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate({
		"children": {
			"wyjazdInvites": {},
			"funkcje": "jednostka"
		},
		"funkcje": "jednostka",
		"funkcjeWyjazdowe": "jednostka",
		"wyjazdInvites": {},
		"wyjazdApprovalRequests": {}
	})

	// Check permissions
	await user.checkPermission(Wyjazd.PERMISSIONS.CREATE)

	const wyjazdy = [
		...user.wyjazdInvites,
		...user.wyjazdApprovalRequests,
		...user.funkcjeWyjazdowe.map(f => f.jednostka),
		...user.children.flatMap(c => c.wyjazdInvites)
	].unique("id")
	
	return html("main", {
		user,
		wyjazdy
	})
}