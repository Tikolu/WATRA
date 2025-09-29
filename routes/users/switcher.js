import html from "modules/html.js"

export default async function({user}) {
	const savedUsers = (this.request.token?.saved || [])
						.filter(u => u.id != user.id)
	
	await savedUsers.populate({}, {ref: "User"})

	return html("user/switcher", {
		user,
		savedUsers
	})
}