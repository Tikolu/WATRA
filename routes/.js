import html from "modules/html.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate({
		"children": {},
		"funkcje": "jednostka",
		"funkcjeWyjazdowe": "jednostka"
	})
	
	return html("main", { user })
}