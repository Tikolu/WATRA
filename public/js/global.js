// Base64 helper functions
const Base64 = {
	encode: v => btoa(v),
	decode: v => atob(v)
}

// Sleep function 
function sleep(ms) {
	return new Promise(resolve => {
		if(ms == Infinity) return
		setTimeout(resolve, ms)
	})
}

// Object isEmpty utility function
Object.isEmpty = object => {
	if(object instanceof Array) {
		return object.length === 0
	} else if(object instanceof Object) {
		return Object.keys(object).length === 0
	}
	return false
}

// Popups and dialogs
const Popup = {
	create({message, type, icon, time=3500}) {
		const dialog = document.createElement("dialog")
		dialog.classList.add("message")
		if(type) dialog.classList.add(type)

		if(icon) dialog.innerHTML = `
			<span class="icon">${icon}</span>
		`
		dialog.innerHTML += `
			<p>${message}</p>
			<button class="icon" onclick="this.parentElement.close()">close</button>
		`

		// Get focused element
		const focusElement = document.activeElement

		// Find potential existing dialog
		const existingDialog = document.querySelector("body > dialog.message[open]")
		if(existingDialog) {
			existingDialog.insertAdjacentElement("beforebegin", dialog)
			// If contents differ, calculate how much time is left on previous dialog
			if(existingDialog.innerText != dialog.innerText) {
				time += existingDialog.timings.show + existingDialog.timings.delay - Date.now()
			}
		} else document.body.append(dialog)

		dialog.timings = {
			show: Date.now(),
			delay: time
		}
		dialog.show()

		dialog.closePromise = new Promise(resolve => {
			// Wait for animation to finish before removing
			dialog.onclose = async () => {
				await sleep(250)
				dialog.remove()
				resolve(true)
			}
		})

		sleep(time).then(() => {
			dialog.timings.hide = Date.now()
			dialog.close()
		})


		// If focus is in an input, prevent dialog from stealing focus
		if(focusElement.matches("input, textarea")) {
			sleep(100).then(() => focusElement.focus())
		}

		return dialog
	},

	info(message, icon="") {
		return Popup.create({
			message,
			icon
		})
	},

	success(message, icon="check_circle") {
		return Popup.create({
			message,
			type: "success",
			icon,
			time: 1500
		})
	},

	error(message, icon="error") {
		return Popup.create({
			message,
			type: "error",
			icon
		})
	}
}

// Dialog "result" asynchronous function
HTMLDialogElement.prototype.result = function(modal=true) {
	this[modal ? "showModal" : "show"]()
	return new Promise((resolve, reject) => {
		this.onclose = () => reject("Popup closed")
		for(const button of this.querySelectorAll("button")) {
			button.onclick = () => {
				const command = button.getAttribute("command")
				resolve(command === "" ? true : command)
				this.close()
			}
		}
	})
}// API functions
const API = {
	handlers: {},

	async request(get="", post=undefined) {
		let options = {
			credentials: "same-origin",
			headers: {}
		}
		if(post) {
			options.method = "POST"
			options.body = JSON.stringify(post)
			options.headers["Content-Type"] = "application/json"
		}
		let response, text, json
		try {
			response = await fetch(`/api/${get}`, options)
		} catch(error) {
			text = "Connection failed"
		}
		text ||= await response?.text()
		try {
			json = JSON.parse(text)
		} catch(error) {
			text ||= "Error parsing API response"
			if(text.includes("\n")) text = text.split("\n")[0]
			throw text
		}
		if(json.error) {
			throw json.error.message.replace(/^Error: /, "")
		}
		return json
	},

	registerHandler(api, handler) {
		if(api in this.handlers) {
			throw new Error(`API handler already registered for ${api}`)
		}
		this.handlers[api] = handler
	}
}

// API attribute system
for(const element of document.querySelectorAll("[api]")) {
	const api = element.getAttribute("api")
	
	let event
	if(element.matches("button")) event = "onclick"
	else if(element.matches("input[type=checkbox]")) event = "onchange"
	else if(element.matches("input")) event = "onsubmit"
	else if(element.matches("select")) event = "onchange"
	else {
		console.warn("API attribute not supported for this element:\n", element)
		continue
	}

	element[event] = async () => {
		let handler = API.handlers[api]

		// Find wildcard handler
		if(!handler) for(const handlerKey in API.handlers) {
			const regex = new RegExp(handlerKey.replace(/\[\w+\]/g, ".*"))
			if(!api.match(regex)) continue
			handler = API.handlers[handlerKey]
			break
		}

		if(!handler) throw new Error(`API handler not found for ${api}`)

		// Clone handler for modifying
		handler = {...handler, api}

		// Create POST data from META
		let data = {...META}

		// Add form values to POST data
		for(const formElement of element.parentElement.querySelectorAll("[name]")) {
			data[formElement.name] = formElement.value
		}

		// Check element validity
		if(!element.checkValidity()) {
			element.classList.add("invalid")
			return
		}

		// Add element value to POST data
		handler.valueKey ||= element.name
		if(element.value || handler.valueKey) {
			handler.valueKey ||= "value"
			data[handler.valueKey] = element.value
		}

		// Trigger data validation callback
		if(handler.validate) {
			const validationResponse = await handler.validate(data)
			if(!validationResponse) return
			handler = {...handler, ...validationResponse}
		}

		// Replace segments in API string
		handler.api = handler.api.replaceAll(/\[\w+\]/g, segment => {
			segment = segment.slice(1, -1)
			const value = data[segment]
			if(!value) throw new Error(`Missing value for ${segment}`)
			delete data[segment]
			return value
		})

		// Trigger "before" callback
		if(handler.before && !await handler.before(data)) return

		// Show loading message
		let progressMessage
		if(handler.progressText) {
			progressMessage = Popup.create({
				message: handler.progressText,
				type: "progress",
				icon: "progress_activity",
			})
		}

		// Disable element during API call
		element.disabled = true
		element.classList.add("loading")
		element.classList.remove("invalid")

		if(Object.isEmpty(data)) data = undefined
		try {
			var response = await API.request(handler.api, data)
		} catch(error) {
			element.classList.add("invalid")
			Popup.error(error)
			return
		} finally {
			if(progressMessage) progressMessage.close()
			// Re-enable element
			element.disabled = false
			element.classList.remove("loading")
		}

		// Trigger "after" callback
		await handler.after?.(response)

		// Update element modified state
		if(response[handler.valueKey] !== undefined) {
			element.value = response[handler.valueKey]
		}
		element.initialValue = element.value
		element.modified = false

		// Show success message
		if(handler.successText) {
			Popup.success(handler.successText)
		}
	}
}

// Custom input fields
for(const input of document.querySelectorAll("input")) {
	input.initialValue = input.value
	input.modified = false
	input.addEventListener("input", () => {
		input.modified = input.value != input.initialValue
	})
	input.addEventListener("keypress", event => {
		if(event.key != "Enter") return
		input.blur()
	})
	input.addEventListener("blur", event => {
		if(!input.modified) return
		input.dispatchEvent(new Event("submit"))
	})
	
	// Custom date input
	if(input.matches("[type^=date]")) {
		input.addEventListener("change", event => {
			if(!input.value || input.matches(":focus")) return
			input.blur()
		})
	}
}

// Disable form elements
for(const form of document.querySelectorAll("form")) {
	form.onsubmit = event => {
		event.preventDefault()
	}
}

// Link buttons
for(const button of document.querySelectorAll("button[href]")) {
	const a = document.createElement("a")
	a.href = button.getAttribute("href")
	button.removeAttribute("href")
	button.insertAdjacentElement("beforebegin", a)
	button.tabIndex = -1
	a.append(button)
}

// Make all element IDs globally accessible
for(const element of document.querySelectorAll("[id]")) {
	const replacer = r => r.toUpperCase().replace("-", "")
	const id = element.id.replaceAll(/-\w/g, replacer)
	if(window[id]) continue
	window[id] = element
}

// META tag system
const META = {}
for(const metaTag of document.querySelectorAll("meta[name]:not([name=viewport])")) {
	let metaContent = metaTag.content
	if(metaTag.hasAttribute("base64")) {
		metaContent = Base64.decode(metaContent)
		metaContent = JSON.parse(metaContent)
	}
	META[metaTag.name] = metaContent
}

// Event streaming
const eventSource = new EventSource("/api/stream")
eventSource.addEventListener("update", event => {
	if(!event.data) return
	const data = JSON.parse(event.data)
	for(const condition of pageRefreshConditions) {
		if(condition.type != data.type || condition.id != data.id) continue
		document.startViewTransition(() => document.location.reload())
		break
	}
})
eventSource.addEventListener("error", event => {
	if(!event.data) return
	const error = JSON.parse(event.data)
	throw new Error(error.message || error)
})

const pageRefreshConditions = []

function registerRefreshCondition(path) {
	const url = new URL(path)
	const segments = url.pathname.substring("1").split("/")
	if(segments.length != 2) return
	if(!segments[0].match(/^\w+$/)) return
	if(!segments[1].match(/^[0-9a-f]+$/)) return

	const [type, id] = segments
	if(pageRefreshConditions.some(c => c.type == type && c.id == id)) return
	pageRefreshConditions.push({type, id})
}

registerRefreshCondition(document.location)
for(const link of document.querySelectorAll("a[href]")) {
	registerRefreshCondition(link.href)
}