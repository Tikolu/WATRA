import * as Path from "node:path"
import HTTPError from "modules/server/error.js"

class Route {
	static dir = "routes"
	static TYPE = {
		DIR: "dir",
		FILE: "file",
		FUNCTION: "function"
	}
	
	constructor(path="/", type=Route.TYPE.DIR, fn) {
		this.type = type

		if(type == Route.TYPE.FUNCTION) this.fn = fn
		else {
			this.path = path

			// Determine parameter
			const basename = Path.basename(path, ".js")
			const match = basename.match(/^\[(.+)\]$/)
			if(match) {
				this.parameter = match[1]
			}
		}
	}

	get modulePath() {
		// Route is a directory
		if(this.type == Route.TYPE.DIR) {
			return `../../${Route.dir}${this.path}..js`

		// Route is a file
		} else if(this.type == Route.TYPE.FILE) {
			return `../../${Route.dir}${this.path}`

		} else {
			return null
		}
	}

	async loadSubRoutes() {
		if(!this.subRoutes) {
			this.subRoutes = {}

			// Load route module
			let routeModule
			try {
				routeModule = await import(this.modulePath)
			} catch {
				routeModule = {}
			}

			// List subroutes from module
			for(const name in routeModule) {
				let key = name
				if(key == "default") key = "_default"
				this.subRoutes[key] = new Route(`${this.path}`, Route.TYPE.FUNCTION, routeModule[name])
			}

			// Route is a directory, list files inside
			if(this.type == Route.TYPE.DIR) {
				const files = await Array.fromAsync(Deno.readDir(`${Route.dir}/${this.path}`))
				for(const file of files) {
					if(file.name.startsWith(".") || file.name == "default.js") continue
					const routeName = file.name.replace(/\.js$/, "")
					this.subRoutes[routeName] = new Route(
						`${this.path}${file.name}${file.isDirectory ? "/" : ""}`,
						file.isFile ? Route.TYPE.FILE : Route.TYPE.DIR
					)
				}
			}

			// Remember parameter subroute
			for(const key in this.subRoutes) {
				if(!this.subRoutes[key].parameter) continue
				if(this.parameterRoute) {
					throw new Error(`Multiple parameter routes defined for ${this.path}`)
				}
				this.parameterRoute = this.subRoutes[key]
			}
		}

		return this.subRoutes
	}

	async execute(routingContext, routePath=[]) {
		// Try to decode URL segment, otherwise set the response code to 400
		let segment = routePath.shift()
		if(segment !== undefined) {
			try {
				segment = decodeURIComponent(segment || "")
			} catch {
				routingContext.handleError(new HTTPError(400))
				return
			}
		}
		
		// Route is a function
		if(this.type == Route.TYPE.FUNCTION) {
			try {
				// Call the route function
				routingContext.lastOutput = this.fn.call(routingContext, routingContext.routeData)

				// If route function returns a promise, wait for it to resolve
				if(routingContext.lastOutput instanceof Promise) routingContext.lastOutput = await routingContext.lastOutput

				// If function is an async iterator, enable streaming mode
				if(routingContext.lastOutput && routingContext.lastOutput[Symbol.asyncIterator]) {
					routingContext.response.startStream()
					const processIterator = async iterator => {
						try {
							for await(const {event, data} of iterator) {
								if(!routingContext.response.open) break
								if(routingContext.lastError) break
								await routingContext.response.sendStreamEvent(event, data)
							}
						} catch(error) {
							await routingContext.handleError(error)
						}
						iterator.return()
						routingContext.response.close()
					}
					processIterator(routingContext.lastOutput)

				}
				// Register timings
				routingContext.response.registerTiming("route", `/${this.path} (${this.fn.name})`)
			
			} catch(error) {
				// Handle runtime errors
				routingContext.handleError(error)
			}

		// Route is a directory or module
		} else {
			// If an "_open" function exists, run it
			await this.loadSubRoutes()
			await this.subRoutes._open?.execute(routingContext)

			// Stop processing if error occurred or response is closed
			if(routingContext.lastError || !routingContext.response.open) {
				// //

			// If this is the last segment, run "_default" route, otherwise 404
			} else if(segment === undefined) {
				if(this.subRoutes._default) {
					await this.subRoutes._default.execute(routingContext)
				} else {
					routingContext.handleError(new HTTPError(404))
				}

			// Try to match segment to subRoute
			} else if(this.subRoutes[segment]) {
				await this.subRoutes[segment].execute(routingContext, routePath)

			// Try to match paramter route
			} else if(this.parameterRoute) {
				routingContext.routeData[this.parameterRoute.parameter] = segment
				await this.parameterRoute.execute(routingContext, routePath)

			// Respnond with 404, unless an error is already present
			} else if(routingContext.response.statusCode == 200) {
				routingContext.handleError(new HTTPError(404))
			}

		}
		
		// If an "_exit" function exists, run it
		if(this.subRoutes?._exit && routingContext.response.open && routingContext.response.headers.get("Connection") != "keep-alive") {
			await this.subRoutes._exit.execute(routingContext)
		}
	}
}

class RoutingContext {
	constructor(request, response) {
		this.request = request
		this.response = response
		this.routeData = {}

		// Parse path from URL, removing leading and trailing slash
		const url = request.address.pathname.replace(/(^\/|\/$)/g, "")
		this.routePath = url ? url.split("/") : []
	}

	addRouteData(data, override=true) {
		if(override) this.routeData = {...this.routeData, ...data}
		else this.routeData = {...data, ...this.routeData}
	}

	handleError(error) {
		// If error is a string, convert it to an Error object
		if(!(error instanceof HTTPError)) {
			error = new HTTPError(error)
		}

		console.log("\nURL:", decodeURI(this.request.address.pathname))
		console.error(error)

		// If in streaming mode, output error to stream
		if(this.response.streaming) {
			const {message, httpCode: code, stack} = error
			return this.response.sendStreamEvent("error", {message, code, stack})
		}

		// If an error is already present, just print plain error message and send response
		if(this.lastError || this.response.statusCode >= 400) {
			this.response.headers.set("Content-Type", "text/plain; charset=utf-8")
			this.response.write(this.lastError?.message || `Error ${this.response.statusCode}!`)
			this.response.write("\n\n\n\nWhile handling the above error, another error occured:\n\n")
			this.response.write(error.stack)
			this.response.close()
			return
		}

		// Otherwise, remember the error for later
		this.lastError = error
		this.response.statusCode = error.httpCode || 500

		// Add a helper function for clearing the error
		this.lastError.clear = () => this.lastError = null
	}
}

const rootRoute = new Route()

export default async function(request, response) {
	const routingContext = new RoutingContext(request, response)
	await rootRoute.execute(routingContext, routingContext.routePath)
}