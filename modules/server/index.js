import mime from "mime"
import * as Path from "node:path"

import Token from "./token.js"
import * as rateLimit from "./rateLimiting.js"

import ServerRequest from "modules/server/request.js"
import ServerResponse from "modules/server/response.js"
import findRoute from "modules/server/route.js"
import { Logger } from "modules/logger.js"

const logger = new Logger("Server", 34)

async function handlePublicFile(url, response) {
	url = Path.join("public", url)
	if(!url.startsWith("public/")) return

	// Check if path is a file
	try {
		const stat = await Deno.stat(url)
		if(!stat.isFile) return
	} catch {
		return
	}

	// Get file type
	const type = mime.getType(url)	
	if(!type) return

	response.headers.set("Content-Type", `${type}; charset=utf-8`)
	response.headers.set("Cache-Control", "max-age=31536000, immutable")
	response.write(await Deno.readFile(url))
	response.close()
	return true
}

async function handler(req) {
	// Check rate limits
	const ip = req.headers.get("x-forwarded-for")
	if(rateLimit.exceeded(ip)) {
		return new Response("Too many requests\nPlease slow down!", {status: 429})
	}

	// Initialize request object from request and blank response object
	const request = new ServerRequest(req)
	const response = new ServerResponse(developmentMode)

	// If a cookie header is present, parse cookies
	if(request.headers.has("Cookie")) {
		request.getCookies()
		// If a token cookie is present, parse token
		if(request.cookies.token) {
			request.token = new Token(await Token.parse(request.cookies.token))
		}
	}
	// Otherwise, create blank token
	request.token ||= new Token()

	// If URL ends with a file extension, check if a matching file exists
	if(/.\.[a-z]{2,4}$/.test(request.address.pathname)) await handlePublicFile(request.address.pathname, response)

	// Use the routing system to find the appropriate route function
	if(response.open) await findRoute(request, response)

	// Final fallback, if reponse has not been closed, close it
	if(response.open && !response.streaming) response.close();

	// Send the token
	const tokenCookie = await request.token.toCookie()
	if(tokenCookie) response.headers.set("Set-Cookie", tokenCookie)
	
	response.registerTiming("server", "close response")
	const res = response.toResponse()

	// Check rate limits for error responses
	if(!res.ok) {
		rateLimit.recordRequest(ip)
	}
	
	return res
}

let server
const controller = new AbortController()
let developmentMode = false

export function start({host, port, dev=false, beforeRequest}) {
	developmentMode = dev

	server = Deno.serve({
		hostname: host,
		port,
		signal: controller.signal,
		onListen({port}) {
			logger.log(` Started on ${host}:${port}`)
		},
	}, async req => {
		await beforeRequest?.()
		return await handler(req)
	})
}

export async function stop() {
	controller.abort()
	await server.finished
	return
}