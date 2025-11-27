import randomID from "modules/randomID.js"
import HTTPError from "modules/server/error.js"

import User from "modules/schemas/user"

export default class {
	constructor(token) {
		this.token = token
	}

	/** Login a user */
	async login(user) {
		// Set active user
		this.token.active = user.id

		// Generate client ID
		this.token.client ||= randomID()

		// Update saved users	
		this.token.saved ||= []
		if(!this.token.saved.includes(user.id)) this.token.saved.push(user.id)
		this.token.modified = true

		// Update user
		user.auth.lastLogin = Date.now()
		await user.save()
	}

	/** Login using an access code */
	async codeLogin(accessCode) {
		// Find user matching the access code
		const user = await User.findByAccessCode(accessCode)
		if(!user) return
		
		// Clear access code from user
		user.auth.accessCode = undefined
		await user.save()

		// Login
		await this.login(user)

		return user
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

	/** Set a passkey challenge and timeout */
	setChallenge(challenge, timeout) {
		const expiryTime = Date.now() + timeout
		this.token.chall = [challenge, expiryTime]
	}

	/** Get a passkey challenge, after verifying timeout */
	getChallenge() {
		const [challenge, expiry] = this.token.chall || []
		delete this.token.chall
		
		if(!expiry || Date.now() > expiry) {
			throw new HTTPError(400, "Minął termin ważności weryfikacji, spróbuj ponownie")
		}

		return challenge
	}
}