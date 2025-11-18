import randomID from "modules/randomID.js"

export default class {
	constructor(token) {
		this.token = token
	}

	/** Login a user */
	login(userID) {
		// Set active user
		this.token.active = userID

		// Generate client ID
		this.token.client ||= randomID()

		// Update saved users	
		this.token.saved ||= []
		if(!this.token.saved.includes(userID)) this.token.saved.push(userID)
		this.token.modified = true
	}

	/** Logout the current user */
	logout(full) {
		const userID = this.userID

		// Remove active user
		delete this.token.active

		if(full) {
			// Remove user from saved users
			this.token.saved = this.token.saved.filter(id => id != userID)
			if(!this.token.saved.length) delete this.token.saved
		}
	}
}