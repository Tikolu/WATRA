import html from "modules/html.js"

export function _open() {
	const saveRedirect = !this.routePath.equals(["users", "switcher"])
	if(!this.session.ensureActiveUser(this, saveRedirect)) return
}

export async function switcher({user}) {
	const savedUsers = (this.request.token?.saved || [])
						.filter(u => u.id != user.id)
	
	await savedUsers.populate({}, {ref: "User"})

	return html("user/switcher", {
		user,
		savedUsers
	})
}

export function passkeyInfo() {
	return html("user/passkeyInfo")
}