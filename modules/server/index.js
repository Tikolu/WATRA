import mime from "npm:mime"
import { join as joinPath } from "node:path"


import ServerRequest from "modules/server/request.js"
import ServerResponse from "modules/server/response.js"

import findRoute from "modules/server/route.js"

async function handlePublicFile(url, response) {
	url = joinPath("public", url)

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
	response.headers.set("Cache-Control", developmentMode ? "no-store" : "max-age=31536000, immutable")
	response.write(await Deno.readFile(url))
	response.close()
	return true
}

async function handler(req) {
	// Initialize request object from request and blank response object
	const request = new ServerRequest(req)
	const response = new ServerResponse(developmentMode)

	// If a cookie header is present, parse cookies
	if(request.headers.has("Cookie")) {
		request.getCookies()
		// If a token cookie is present, parse token
		if(request.cookies.token) await request.parseToken()
	}

	// If URL ends with a file extension, check if a matching file exists
	if(/.\.[a-z]{2,4}$/.test(request.address.pathname)) await handlePublicFile(request.address.pathname, response)

	// Use the routing system to find the appropriate route file
	if(response.open) await findRoute(request, response)

	// Final fallback, if reponse has not been closed, close it
	if(response.open && !response.streaming) response.close();

	// Send the token, if one is present
	if(response.token) await response.sendToken()
	
	response.registerTiming("server", "close response")
	return response.toResponse()
}

let server;
const controller = new AbortController()
let developmentMode = false

export function start({host, port, dev=false, beforeRequest}) {
	developmentMode = dev

	server = Deno.serve({
		host,
		port,
		signal: controller.signal,
		onListen({port}) {
			console.log(`\x1b[34m[Server]\x1b[0m  Started on port ${port}`)
		},
	}, beforeRequest ?
		async req => {
			await beforeRequest()
			return await handler(req)
		}
	: handler)
}

export async function stop() {
	controller.abort()
	await server.finished
	return
}