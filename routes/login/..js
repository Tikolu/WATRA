export function open({user}) {
	// Check if user is already logged in
	if(user) {
		this.response.redirect("/")
		return
	}
}