import html from "modules/html.js"

export default function({user}) {
	if(!user) return this.response.redirect("/login")
	
	return html("main", {
		user
	})
}