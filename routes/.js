import html from "modules/html.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate("children")
	await user.populate(["funkcje", "funkcjeWyjazdowe"], "jednostka")
	
	return html("main", { user })
}