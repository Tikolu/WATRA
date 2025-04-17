import * as Token from "modules/server/token.js"

/**
 * ServerResponse class, representing a mutable response from the server
 */
export default class {
	constructor() {
		this.statusCode = 200
		this.body = undefined
		this.headers = new Headers()
		this.open = true

		// Track server timings
		this.lastTiming = performance.now()
	}

	/** Closes the response - disables further writing */
	close() {
		this.open = false
	}

	/** Writes text to the response's body */
	write(data) {
		if(!this.open) throw new Error("Cannot write to closed response")
		// If data is an array of bytes, convert to blob
		if(data instanceof Uint8Array) {
			data = new Blob([data])
		}
		// Append to body if text already exists
		if(this.body && typeof this.body == "string") {
			if(typeof data != "string") {
				throw new Error("Cannot write binary data to text response")
			}
			this.body += data
		} else {
			this.body = data
		}
	}
	
	/** Redirect to another URL, and close the response */
	redirect(url) {
		this.statusCode = 302
		this.headers.set("Location", url)
		this.body = ""
		this.close()
	}

	/** Returns the response as a read-only Deno Response object */
	toResponse() {
		const response = new Response(this.body, {
			status: this.statusCode,
			body: this.body,
			headers: this.headers
		})

		return response
	}

	async sendToken() {
		await Token.send(this)
	}

	registerTiming(name, description) {
		const now = performance.now()
		const duration = now - this.lastTiming
		this.lastTiming = now

		// Replace non ASCII characters
		name = name.replaceAll(/[^\x00-\x7F]/g, "_")
		description = description.replaceAll(/[^\x00-\x7F]/g, "_")
		
		this.headers.append("Server-Timing", `${name};desc="${description}";dur=${duration.toFixed(3)}`)
	}

	// keepAlive() {
	// 	this.setHeader("Content-Type", "text/event-stream")
	// 	this.setHeader("Connection", "keep-alive")
	// 	this.write(":start")

	// }
}