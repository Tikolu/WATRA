export function _open({user}) {
	if(!user) return this.response.redirect("/login")
}