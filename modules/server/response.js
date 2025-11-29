/**
 * ServerResponse class, representing a mutable response from the server
 */
export default class {
	constructor(debug) {
		this.statusCode = 200
		this.body = undefined
		this.headers = new Headers()
		this.open = true
		this.streaming = false

		// Track server timings
		this.debug = debug
		if(this.debug) this.lastTiming = performance.now()
		this.registerTiming("server", "open response")
	}

	/** Closes the response - disables further writing */
	close() {
		this.open = false

		// If in stream mode, attempt to close stream
		if(this.streaming) {
			this.streamWriter.close().catch(() => {})
		}
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

		// If in streaming mode, send to stream
		} else if(this.streaming) {
			return this.streamWriter.write(data)

		// Otherwise, replace body with new content
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

	/** Registers server timings, which are later sent in the Server-Timing header */
	registerTiming(name, description) {
		if(!this.debug) return

		const now = performance.now()
		const duration = now - (this.lastTiming || now)
		this.lastTiming = now

		// Replace non ASCII characters
		name = name.replaceAll(/[^\x00-\x7F]/g, "_")
		description = description.replaceAll(/[^\x00-\x7F]/g, "_")
		
		this.headers.append("Server-Timing", `${name};desc="${description}";dur=${duration.toFixed(3)}`)
	}

	/** Starts streaming mode */
	startStream() {
		this.headers.set("Content-Type", "text/event-stream")
		this.headers.set("Connection", "keep-alive")
		this.streaming = true

		// Set up stream
		const encoderStream = new TextEncoderStream()
		this.body = encoderStream.readable
		this.streamWriter = encoderStream.writable.getWriter()
		this.streamWriter.closed.catch(() => this.close())
		return this.streamWriter
	}

	/** Writes data following the server-sent event syntax to the stream */
	async sendStreamEvent(event, data) {
		if(!this.streaming) throw new Error("Not in streaming mode")

		data = JSON.stringify(data)

		let response = `event: ${event}\n`
		if(data) response += `data: ${data}\n`
		response += "\n"
		
		await this.write(response)
	}
}