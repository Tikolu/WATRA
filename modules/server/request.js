import * as Token from "modules/server/token.js";

/**
 * ServerRequest class, extends the built in Deno Request class with additional functionality
 */
export default class extends Request {
	cookies = {}
	token = {}

	constructor(request) {
		super(request)
		
		// Parse request URL
		this.address = new URL(request.url)
	}

	getParam(param) {
		return this.address.searchParams.get(param)
	}
	
	async getBody() {
		if(!this.body) return this.body
		if(this.decodedBody) return this.decodedBody

		const decoder = new TextDecoder()
		this.decodedBody = ""
		for await (const chunk of this.body) {
			this.decodedBody += decoder.decode(chunk)
		}
		return this.decodedBody
	}

	getCookies() {
		const cookieHeader = this.headers.get("Cookie")
		this.cookies = {}
		for(const cookie of cookieHeader.split(";")) {
			let [name, ...value] = cookie.split("=")
			if(!name) return
			name = name.trim()
			value = value.join("=").trim()
			if(!name || !value) return
			this.cookies[name] = decodeURIComponent(value)
		}
		return this.cookies
	}

	async parseToken() {
		await Token.parse(this)
	}
}