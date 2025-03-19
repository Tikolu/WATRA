import html from "modules/html.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate([
		"children",
		{path: "funkcje", populate: "jednostka"}
	])
	
	return html("main", { user })
}