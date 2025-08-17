export default function({user, userID}) {
	const token = this.request.token
	
	// Remove active user
	delete token.active

	// Remove user from saved users
	userID ||= user?.id
	const savedUsers = this.request.token?.saved || []
	token.saved = savedUsers.filter(id => id != userID)

	// Send back token
	this.response.token = token
}