import mime from "mime"
import * as Path from "node:path"

import Token from "./token.js"
import * as rateLimit from "./rateLimiting.js"

import ServerRequest from "modules/server/request.js"
import ServerResponse from "modules/server/response.js"
import findRoute from "modules/server/route.js"
import { Logger } from "modules/logger.js"
import Config from "modules/config.js"

const cspDirectives = [
	"default-src 'self'",
	"frame-ancestors 'self'",
	"style-src 'self' https://fonts.googleapis.com",
	"font-src https://fonts.gstatic.com",
	"img-src 'self' data: https://api.qrserver.com",
	"form-action 'self'",
].join("; ")

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
	response.headers.set("Cache-Control", "max-age=31536000")
	response.write(await Deno.readFile(url))
	response.close()
	return true
}

async function handler(req, ip) {
	// Get IP from header is in proxy mode
	const forwardedFor = req.headers.get("x-forwarded-for")
	if(forwardedFor) {
		if(ip) return new Response("Header \"X-Forwarded-For\" not allowed", {status: 400})
		ip = forwardedFor
	} else if(!ip) {
		return new Response("Header \"X-Forwarded-For\" required", {status: 400})
	}

	// Check rate limits
	if(rateLimit.exceeded(ip)) {
		return new Response("Too many requests\nPlease slow down!", {status: 429})
	}

	// Initialize request object from request and blank response object
	const request = new ServerRequest(req)
	request.sourceIP = ip
	const response = new ServerResponse()

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
	if(response.open && !response.streaming) response.close()

	// Send the token
	const tokenCookie = await request.token.toCookie()
	if(tokenCookie) response.headers.set("Set-Cookie", tokenCookie)
	
	// Security headers
	response.headers.set("Strict-Transport-Security", "max-age=31536000")
	response.headers.set("X-Content-Type-Options", "nosniff")
	response.headers.set("Content-Security-Policy", cspDirectives)
	
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

// Attempt to load certificate
async function loadCert() {
	const certPath = Deno.env.get("HTTPS_CERT_PATH")
	const keyPath = Deno.env.get("HTTPS_KEY_PATH")
	if(certPath || keyPath) {
		return [
			await Deno.readTextFile(certPath),
			await Deno.readTextFile(keyPath)
		]
	} else {
		return [undefined, undefined]
	}
}
const [cert, key] = await loadCert()

export function start({host, port, proxy=false, beforeRequest}) {
	server = Deno.serve({
		hostname: host,
		port,
		signal: controller.signal,
		cert,
		key,
		onListen({port}) {
			logger.log(` Started on ${host}:${port}${proxy ? " (proxy mode)" : ""}`)
		},
	}, async (req, conn) => {
		await beforeRequest?.()
		return await handler(req, !proxy ? conn.remoteAddr.hostname : null)
	})
}

export async function stop() {
	controller.abort()
	await server.finished
	return
}