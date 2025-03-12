export default function() {
	const token = this.request.token
	
	// Remove active user
	delete token.active

	// Send back token
	this.response.token = token
}