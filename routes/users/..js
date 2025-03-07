export function open({user}) {
	if(!user) return this.response.redirect("/login")
}