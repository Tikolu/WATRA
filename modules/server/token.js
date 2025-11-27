import * as Base64 from "modules/base64.js";
import * as Crypto from "modules/crypto.js";

export default class {
	/** Parses and verifies a token from a cookie string */
	static async parse(cookie) {
		if(!cookie) return

		// Parse token data from cookie
		const tokenData = cookie.split(".")
		if(tokenData.length != 2) return

		// Verify token signature
		if(!await Crypto.verify(...tokenData)) return
		
		try {
			const token = Base64.decode(tokenData[0])
			return JSON.parse(token)
		} catch {
			return
		}
	}

	constructor(token) {
		this.token = token || {}
		this.modified = false
		
		// Proxy to track modifications
		const proxyHandler = {
			get(target, property) {
				if(property in target) return target[property]
				const value = target.token[property]
				return value
			},
			set(target, property, value) {
				if(property in target) {
					target[property] = value
				} else {
					target.token[property] = value
					target.modified = true
				}
				return true
			},
			deleteProperty(target, property) {
				delete target.token[property]
				target.modified = true
				return true
			}
		}
		return new Proxy(this, proxyHandler)
	}

	/** Signs a token and returns its cookie string */
	async toCookie() {
		// Skip if token is unmodified
		if(!this.modified) return

		let token
		try {
			token = JSON.stringify(this.token)	
		} catch {
			token = ""
		}

		if(token == "{}" || token == "\"\"") token = ""
		else token = Base64.encode(token)

		if(token) {
			// Sign token
			const hash = await Crypto.sign(token)
			return `token=${token}.${hash}; Max-Age=34560000; Path=/; Secure; HttpOnly`
		} else {
			// Clear token cookie if token is empty
			return "token=; Max-Age=-1; Path=/"
		}
	}
}