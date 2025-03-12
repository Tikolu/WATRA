export default function({user}) {
	const token = this.request.token
	
	// Remove active user
	delete token.active

	// Remove user from saved users
	const userID = this.params.get("user") || user?.id
	const savedUsers = this.request.token?.saved || []
	token.saved = savedUsers.filter(id => id != userID)

	// Send back token
	this.response.token = token
}