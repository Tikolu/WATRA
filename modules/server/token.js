import SERVER_PRIVATE_KEY from "modules/key.js"
import * as Base64 from "modules/base64.js";
import sha256 from "modules/sha256.js";

export async function parse(request) {
	request.token = {}
	if(!request.cookies.token) return

	const tokenData = request.cookies.token.split(".")
	if(tokenData.length != 2) return

	const tokenHash = await sha256(tokenData[0] + SERVER_PRIVATE_KEY)
	if(tokenHash !== tokenData[1]) return

	try {
		let token = Base64.decode(tokenData[0])
		token = JSON.parse(token)
		request.token = token
	} catch {
		return
	}
}

export async function send(response) {
	let token;
	try {
		token = JSON.stringify(response.token)	
	} catch {
		token = ""
	}

	if(token == "{}" || token == "\"\"") token = ""
	else token = Base64.encode(token)

	if(token) {
		const hash = await sha256(token + SERVER_PRIVATE_KEY)
		const cookie = `${token}.${hash}`
		response.headers.set("Set-Cookie", `token=${cookie}; Max-Age=34560000; Path=/; Secure; HttpOnly`)
	} else {
		response.headers.set("Set-Cookie", `token=; Max-Age=-1; Path=/`)
	}
}