export default function() {
	// Clear cookie token
	this.response.token = {}

	// Redirect to login
	this.response.redirect("/login")
}