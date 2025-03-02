import html from "modules/html.js"

export default function({request, response}) {
	const user = request.token?.user
	if(!user) return response.redirect("/login")

	return html("main", {user})
}