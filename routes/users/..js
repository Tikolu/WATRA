import html from "modules/html.js"

export function _open({user}) {
	if(!user) return this.response.redirect("/login")
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