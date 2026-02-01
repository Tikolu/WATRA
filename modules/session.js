import randomID from "modules/randomID.js"
import HTTPError from "modules/server/error.js"

import User from "modules/schemas/user"

// Logout after 60 minutes
const LOGIN_TIMEOUT = 1000 * 60 * 60

export default class {
	constructor(token) {
		this.token = token
	}

	/** Login a user */
	async login(user) {
		// Set active user
		this.token.active = user.id
		this.resetTimeout()

		// Generate client ID
		this.token.client ||= randomID()

		// Update saved users	
		this.token.saved ||= []
		if(!this.token.saved.includes(user.id)) this.token.saved.push(user.id)
		this.token.modified = true

		// Update user
		await user.auth.registerLogin(this.token.client)
	}

	/** Ensures user is logged in, redirects if not */
	ensureActiveUser(context, saveRedirect = true) {
		if(!context.routeData.user) {
			const path = context.request.address.pathname
			
			// Save redirect path in token, unless one is already set
			if(saveRedirect && !this.token.redirect && path != "/") {
				this.token.redirect = path
			}

			// Redirect to login
			context.response.redirect("/login")
			return false
		}
		return true
	}

	/** Reset session timeout */
	resetTimeout() {
		this.token.loginTime = Date.now()
	}

	/** Login using an access code */
	async codeLogin(accessCode) {
		// Find user matching the access code
		const user = await User.findByAccessCode(accessCode)
		if(!user) return

		// Ensure access code is not expired
		if(user.auth.accessCodeExpiry < Date.now()) {
			throw new HTTPError(400, "Ważność kodu rejestracyjnego wygasła")
		}

		// Login
		await this.login(user)

		return user
	}

	/** Logout the current user */
	logout(full) {
		const userID = this.userID

		// Remove active user
		delete this.token.active
		delete this.token.loginTime

		if(full) {
			// Remove user from saved users
			this.token.saved = this.token.saved.filter(id => id != userID)
			if(!this.token.saved.length) delete this.token.saved
		}
	}

	/** Get currently logged in user */
	async getActiveUser() {
		if(!this.token.active) return

		// If timed out, logout
		if(this.timedOut) {
			this.logout()
			return
		}

		// Get user from database
		const user = await User.findById(this.token.active)

		// If user does not exist, logout fully
		if(!user) {
			this.logout(true)
			return
		}

		// Reset timeout if less than half time remaining
		if(this.remainingTime < LOGIN_TIMEOUT / 2) {
			this.resetTimeout()
		}

		return user
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

	/** Retruns the remaingin amount of time */
	get remainingTime() {
		this.token.loginTime ||= 0

		const time = LOGIN_TIMEOUT - (Date.now() - this.token.loginTime)
		if(time < 0) return 0
		else return time
	}

	/** Returns true if the session has timed out */
	get timedOut() {
		return this.remainingTime <= 0
	}
}