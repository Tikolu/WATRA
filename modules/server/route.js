import HTTPError from "modules/server/error.js";

const REQUIRE_PATH = "../../"
const ILLEGAL_PATTERNS = [/^\.\.$/, /^\.|\.$/]

export default async function(request, response) {
	// Global routeData object
	const routeContext = {
		request,
		response,
		routeData: {},
		addRouteData: data => routeContext.routeData = {...data, ...routeContext.routeData}
	}

	// Function for handling errors
	function handleError(error) {
		// If error is a string, convert it to an Error object
		if(!(error instanceof HTTPError)) {
			error = new HTTPError(error)
		}
		console.log("\nURL:", request.address.pathname)
		console.error(error)
		// If an error is already present, just print plain error message and send response
		if(routeContext.lastError || routeContext.response.statusCode >= 400) {
			routeContext.response.headers.set("Content-Type", "text/plain")
			routeContext.response.write(routeContext.lastError?.message || `Error ${routeContext.response.statusCode}!`)
			routeContext.response.write("\n\n\n\nWhile handling the above error, another error occured:\n\n")
			routeContext.response.write(error.stack)
			routeContext.response.close()
			return
		}
		// Otherwise, remember the error for later
		routeContext.lastError = error
		routeContext.response.statusCode = error.httpCode || 500
		// Add a helper function for clearing the error
		routeContext.lastError.clear = () => routeContext.lastError = null
	}

	// Function for importing route files
	async function parseRoute(path) {
		let routeFile
		
		try {
			routeFile = await import(path)

		} catch(error) {
			// Handle syntax/import errors
			handleError(error)
		}
		return routeFile?.default || routeFile
	}

	// Function for executing route functions
	async function execRoute(fn) {
		if(typeof fn != "function") return
	
		try {
			// Call the route function
			routeContext.lastOutput = await fn.call(routeContext, routeContext.routeData)
			// If route function returns a promise, wait for it to resolve
			if(routeContext.lastOutput instanceof Promise) routeContext.lastOutput = await routeContext.lastOutput
			
		} catch(error) {
			// Handle runtime errors
			handleError(error)
		}
	}

	
	async function findRoute(sections, path) {
		let exitFunction, fallback, foundMatch
		const files = await Array.fromAsync(Deno.readDir(path))

		// Check if directory contains a "..js" global file
		const globalFile = files.find(file => file.name == "..js")
		if(globalFile) {
			const routeFile = await parseRoute(REQUIRE_PATH + path + "/..js")
			if(typeof routeFile == "function") {
				handleError(new HTTPError(500, "Invalid global route file"))
				return
			}
			if(routeFile?.open) await execRoute(routeFile.open)
			if(routeContext.lastError) {
				handleError(routeContext.lastError)
				return
			}
			exitFunction = routeFile?.exit
		}
		
		// Try to decode the URL, otherwise set the response code to 400
		try {
			sections[0] = decodeURIComponent(sections[0] || "")
		} catch {
			handleError(new HTTPError(400))
		}

		// If an illegal character pattern exists in the URL, also repond with 400
		for(const pattern of ILLEGAL_PATTERNS) {
			if(!pattern.test(sections[0])) continue
			handleError(new HTTPError(400))
			break
		}

		// Loop through all the files
		for (const file of files) {
			if(routeContext.lastError) break
			
			const filePath = `${path}/${file.name}`
			// Skip "..js"
			if(file.name == "..js") continue
			
			// If a fallback is encountered, remember it for later
			else if(file.name.startsWith("[") && file.name.endsWith("]")) {
				fallback = file.name
				continue
			}
			
			// If a match is found, run the route file
			else if(sections.length <= 1 && file.name == `${sections[0] || ""}.js`) {
				const routeFile = await parseRoute(REQUIRE_PATH + filePath)
				if(routeFile?.open || routeFile?.exit) {
					handleError(new HTTPError(500, "Invalid route file"))
					break
				}
				await execRoute(routeFile)
				
				foundMatch = true
				break
			}
	
			// If a matching subfolder is found, open it, and repeat the process
			else if(file.name == sections[0] && file.isDirectory) {
				await findRoute(sections.slice(1), filePath)
				
				foundMatch = true
				break
	
			}
		}
	

		if(!foundMatch && !routeContext.lastError) {
			// If no matches were found, try the fallback encountered earlier
			if(fallback && sections[0]) {
				routeContext.routeData[fallback.slice(1, -1)] ||= sections[0]
				await findRoute(sections.slice(1), `${path}/${fallback}`)
			
			// Otherwise, respond with 404
			} else if(routeContext.response.statusCode == 200) {
				handleError(new HTTPError(404))
	
			}
		}
	
		// If an exit function exists, run it
		if(exitFunction && response.open && response.headers.get("Connection") != "keep-alive") await execRoute(exitFunction)
	
	}

	// Start the route search
	const url = request.address.pathname.replace(/^\//, "")
	await findRoute(url.split("/"), "routes")
}