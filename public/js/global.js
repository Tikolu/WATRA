// Global error handlers
window.onerror = (m, s, l, c, error) => {
	console.error(error)
	Popup.error(error)
	logError(error)
}
window.onunhandledrejection = event => {
	console.error(event.reason)
	Popup.error(event.reason)
	logError(event.reason)
}

// Log front-end errors on server
const loggedErrors = []
function logError(error) {
	const message = error.message || error
	if(loggedErrors.includes(message)) return
	loggedErrors.push(message)
	API.request("logError", {
		message,
		stack: error.stack,
		url: document.location.href
	}).catch(() => {})
}

// Debug function
function debug() {
	console.log(...arguments)
	if(!Local.debug) return
	let str = ""
	for(let arg of arguments) {
		if(typeof arg != "string") arg = JSON.stringify(arg)
		str += arg + " "
	}
	Popup.info(str, "build")
}

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

// Parent element generator
Object.defineProperty(HTMLElement.prototype, "parentElementChain", {
	* get() {
		if(!this.parentElement) return
		yield this.parentElement
		yield * this.parentElement.parentElementChain
	}
})

// Create array function 
Array.create = value => {
	if(Array.isArray(value)) return value
	if(!value) return []
	return [value]
}

// Text copy function
async function copy(text) {
	if(text instanceof HTMLElement) {
		let range = document.createRange()
		let selection = window.getSelection()
		range.selectNodeContents(text)
		selection.removeAllRanges()
		selection.addRange(range)
		text = selection.toString()
	}
	await navigator.clipboard.writeText(text)
	Popup.success("Skopiowano", "content_copy")
}

// File to base64
function fileToBase64(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result)
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(file)
	})
}

// Channel for communicating with other tabs
if(window == window.top) {
	window.addEventListener("pageshow", () => {
		document.body.classList.remove("unload")
		window.unloading = false

		window.channel = new BroadcastChannel("channel")
		window.channel.onmessage = message => {
			const {event, type, id} = message.data

			// Refresh the page
			if(event == "refresh") {
				document.location.reload()

			// Unknown event
			} else {
				throw new Error(`Unknown event: ${event}`)

			}
		}
	})

	window.addEventListener("beforeunload", () => {
		console.log("Unloading...")
		document.body.classList.add("unload")
		window.unloading = true
		// Close broadcast channel
		window.channel?.close()
		delete window.channel
	})
}

// Popups and dialogs
const Popup = window.top.Popup || {
	create({message, type, icon, time=3500}) {
		const popup = document.createElement("div")
		popup.classList.add("popup")
		popup.popover = "manual"
		if(type) popup.classList.add(type)

		if(typeof message != "string") message = message?.message || JSON.stringify(message)

		// Add icon to start of popup
		if(icon) {
			const iconElement = document.createElement("i")
			iconElement.innerText = icon
			popup.append(iconElement)
		}
		
		// Add message content
		const content = document.createElement("p")
		content.innerText = message

		// Add close button
		const closeButton = document.createElement("button")
		closeButton.classList.add("icon")
		closeButton.innerText = "close"
		closeButton.onclick = () => popup.close()

		popup.append(content, closeButton)

		// Get focused element
		const focusElement = document.activeElement
		// If focus is in an input, prevent popup from stealing focus
		if(focusElement.matches("input, textarea")) {
			focusElement.preventAPIRequest = true
			sleep(10).then(() => {
				focusElement.focus()
				focusElement.preventAPIRequest = false
			})
		}

		time ||= Infinity

		// Find potential existing popup
		const existingDialog = document.querySelector("body > popup.message:popover-open")
		if(existingDialog) {
			existingDialog.insertAdjacentElement("beforebegin", popup)
			// If contents differ, calculate how much time is left on previous popup
			if(existingDialog.innerText != popup.innerText) {
				time += existingDialog.timings.show + existingDialog.timings.delay - Date.now()
			}
		} else document.body.append(popup)

		popup.timings = {
			show: Date.now(),
			delay: time
		}
		popup.showPopover()

		popup.closePromise = new Promise(resolve => {
			// Wait for animation to finish before removing
			popup.close = async () => {
				popup.classList.add("closing")
				await sleep(250)
				popup.remove()
				resolve(true)
			}
		})

		sleep(time).then(() => {
			popup.timings.hide = Date.now()
			popup.close()
		})

		return popup
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
window.Popup = Popup

function normaliseAttributes(doc = document) {
	for(const element of doc.querySelectorAll("[class='']")) {
		element.removeAttribute("class")
	}
	for(const checkbox of doc.querySelectorAll("input[type=checkbox]")) {
		if(checkbox.checked) checkbox.setAttribute("checked", "")
		else checkbox.removeAttribute("checked")
	}
}

// Dialog "result" asynchronous function
HTMLDialogElement.prototype.result = function(modal=true) {
	this[modal ? "showModal" : "show"]()

	this.dispatchEvent(new Event("open"))

	if(modal && !this.onclick) this.onclick = event => {
		let rect = this.getBoundingClientRect()
		if(event.clientY < rect.top || event.clientY > rect.bottom) return this.close()
		if(event.clientX < rect.left || event.clientX > rect.right) return this.close()
	}
	
	return new Promise((resolve, reject) => {
		this.onclose = () => resolve(false)
		for(const button of this.querySelectorAll("button")) {
			button.addEventListener("click", () => {
				const command = button.getAttribute("command")
				resolve(command === "" ? true : command)
				this.close()
			}, {once: true})
		}
	})
}

// Custom refresh functionality
async function refreshPageData() {
	await sleep(50)

	if(document.body.classList.contains("refresh")) {
		sleep(250).then(() => document.body.classList.remove("refresh"))
	}

	if(window.refreshing || window.unloading) return
	window.refreshing = true
	debug("Refreshing page data...")

	let response
	try {
		response = await fetch(document.location, {redirect: "manual"})
		if(!response.ok) throw new Error()
	} catch(error) {
		// Reload on error
		document.location.reload()
		return
	}
	const body = await response.text()

	const parser = new DOMParser()
	const newDocument = parser.parseFromString(body, "text/html")

	const ignoreElements = ".popup, dialog.frame, link, script, meta[static]"
	const ignoreAttributes = {
		"dialog": ["open"],
		"details": ["open"],
		"body": ["class"],
		"html": ["theme"],
		"*": ["style"]
	}
	const extraAttributes = {
		"input[type=checkbox]": ["checked"]
	}
	const noAnimate = "nav *, head *"

	function nodeFilter(node) {
		// Ignore elements
		if(node.matches(ignoreElements)) return false
		return true
	}

	function nodeMap(node) {
		// Process link buttons
		if(node.matches?.("button[href]")) {
			linkButton(node)
			return node.parentElement
		}
		return node
	}

	function mergeDocuments(oldDoc, newDoc) {
		// If elements are identical, return
		if(oldDoc.isEqualNode(newDoc)) return

		// console.log("Merging", oldDoc, newDoc)

		const ignoreAttrs = []
		for(const selector in ignoreAttributes) {
			if(!oldDoc.matches?.(selector)) continue
			ignoreAttrs.push(...ignoreAttributes[selector])
		}

		// Update attributes
		for(const attr of newDoc.attributes || []) {
			if(ignoreAttrs.includes(attr.name)) continue
			if(oldDoc.getAttribute(attr.name) === attr.value) continue
			oldDoc.setAttribute(attr.name, attr.value)
		}
		for(const selector in extraAttributes) {
			if(!newDoc.matches?.(selector)) continue
			const attrs = extraAttributes[selector]
			for(const attr of attrs) {
				if(newDoc[attr] === oldDoc[attr]) continue
				oldDoc[attr] = newDoc[attr]
			}
		}
		
		// Remove old attributes
		for(const attr of oldDoc.attributes || []) {
			if(ignoreAttrs.includes(attr.name)) continue
			if(!newDoc.hasAttribute(attr.name)) {
				console.log("Removing attr", attr)
				oldDoc.removeAttribute(attr.name)
			}
		}

		// Update content if different
		let replaceContent = (!oldDoc.childElementCount || !newDoc.childElementCount)
		for(const node of [...oldDoc.childNodes, ...newDoc.childNodes]) {
			if(!(node instanceof Text)) continue
			if(!node.textContent.trim()) continue
			replaceContent = true
			break
		}
		if(replaceContent && oldDoc.innerHTML !== newDoc.innerHTML) {
			console.log("Replacing HTML", oldDoc, newDoc)
			oldDoc.innerHTML = newDoc.innerHTML
			return
		}

		// Merge child elements
		const oldChildren = [...oldDoc.children].filter(nodeFilter).map(nodeMap)
		const newChildren = [...newDoc.children].filter(nodeFilter).map(nodeMap)

		// Calculate matching scores for each new element
		for(const newChildIndex in newChildren) {
			const newChild = newChildren[newChildIndex]

			newChild.matchingElements = []
			newChild.totalMatchScore = 0

			for(const oldChildIndex in oldChildren) {
				const oldChild = oldChildren[oldChildIndex]
				if(!oldChild.matches(newChild.tagName)) continue

				let matchScore = 0

				if(oldChild.isEqualNode(newChild)) matchScore += 10
				if(oldChild.id && oldChild.id == newChild.id) matchScore += 10
				
				if(oldChild.href && oldChild.href == newChild.href) matchScore += 2
				if(oldChild.textContent && oldChild.textContent == newChild.textContent) matchScore += 2

				if(oldChild.className && oldChild.className == newChild.className) matchScore += 1
				if(oldChildIndex == newChildIndex) matchScore += 1

				newChild.matchingElements.push({
					element: oldChild,
					matchScore
				})

				newChild.totalMatchScore += matchScore
				if(matchScore > 15) break
			}
			newChild.matchingElements.sort((a, b) => b.matchScore - a.matchScore)
		}
		
		// Find most matching old element for each new element
		const foundElements = []
		for(const newChild of newChildren.toSorted((a, b) => b.totalMatchScore - a.totalMatchScore)) {
			let matchingElement
			for(const {element} of newChild.matchingElements) {
				if(foundElements.includes(element)) continue
				matchingElement = element
				break
			}
			if(matchingElement) {
				foundElements.push(matchingElement)
				mergeDocuments(matchingElement, newChild)
				newChild.matchingElement = matchingElement
			}
		}

		// Add elements
		const elementsToAdd = []
		for(const newChild of newChildren) {
			if(newChild.matchingElement) {
				elementsToAdd.push(newChild.matchingElement)
			} else {
				newChild.matchingElements = undefined
				newChild.totalMatchScore = undefined
				elementsToAdd.push(newChild)
			}
		}

		// Remove elements not present in new document
		for(const oldChild of oldChildren) {
			if(elementsToAdd.includes(oldChild)) continue
			console.log("Removing", oldChild)

			if(oldChild.matches(noAnimate)) oldChild.remove()
			else (async () => {
				oldChild.classList.add("removing")
				await sleep(250)
				oldChild.remove()
			})()
		}

		// Add new elements
		if(!oldDoc.parentElement) return
		for(const newChildIndex in elementsToAdd) {
			const newChild = elementsToAdd[newChildIndex]
			const elementIndex = [...oldDoc.children].filter(e => !e.classList.contains("removing")).indexOf(newChild)
			if(elementIndex == newChildIndex) continue
			console.log(elementIndex < 0 ? "Adding" : "Re-ordering", newChild, "to", oldDoc)
			oldDoc.insertBefore(newChild, oldDoc.children[newChildIndex] || null)

			if(!newChild.matches(noAnimate) && elementIndex == -1) (async () => {
				newChild.classList.add("adding")
				await sleep(250)
				newChild.classList.remove("adding")
			})()
		}
	}

	normaliseAttributes(document)
	normaliseAttributes(newDocument)

	mergeDocuments(document, newDocument)

	window.afterDataRefresh.forEach(f => f())

	window.refreshing = false
}

// List of functions to call after data refresh
window.afterDataRefresh = []

// API functions
const API = {
	handlers: {},
	dataUpdateKeys: {
		roleID: "roles",
		unitID: "units",
		userID: "users",
		eventID: "events"
	},
	onRequestStart: null,
	onRequestEnd: null,
	onRequestError: null,
	onRequestSuccess: null,

	executionQueue: [],

	async request(get="", post=undefined) {
		let options = {
			credentials: "same-origin",
			headers: {},
			redirect: "manual"
		}
		if(post) {
			options.method = "POST"
			options.body = JSON.stringify(post)
			options.headers["Content-Type"] = "application/json"
		}
		let response, text, json
		try {
			response = await fetch(`/api/${get}`, options)
		} catch {
			text = "Connection failed"
		}
		text ||= await response?.text()
		try {
			json = JSON.parse(text)
		} catch {
			text ||= "Error parsing API response"
			if(text.includes("\n")) text = text.split("\n")[0]
			throw text
		}
		if(json.error) {
			const text = json.error.message.replace(/^Error: /, "")
			// Prevent logging error on server
			loggedErrors.push(text)
			throw text
		}
		return json
	},

	/**
	 * Register an API handler
	 * @param {string} api - API endpoint with segments in square brackets
	 * @param {object} handler - Handler object with properties:
	 *  - form: ID of form to use for data, or function to call to get the form element
	 *  - progressText: Text to show while processing
	 *  - persistProgress: Whether to keep progress popup open after request is complete
	 *  - validate: Function to validate data before sending, should return true or an object with additional properties
	 *  - before: Function to call before sending data, should return true to continue or false to cancel
	 *  - after: Function to call after receiving response, should return a promise if async
	 *  - valueKey: Key in response data to update element value, defaults to "value"
	 *  - refresh: Whether to refresh page data after execution, defaults to "true", set to "all" to refresh other tabs
	 *  - successText: Text to show on success
	 */
	registerHandler(api, handler) {
		if(api in this.handlers && !handler.overwrite) {
			throw new Error(`API handler already registered for ${api}`)
		}
		this.handlers[api] = handler
	},

	async executeHandler(element, api, data={}) {
		// Get API from element
		api ||= element.getAttribute("api")
		if(!api) throw new Error("API not specified")

		// Skip if element has preventAPIRequest flag
		if(element?.preventAPIRequest) return

		// Skip execution if request is already in the queue for this API and element
		if(this.executionQueue.some(entry => entry.api == api && entry.element == element)) {
			console.log(`Skipping duplicate API request for ${api}`)
			return
		}

		let handler = API.handlers[api]

		// Find wildcard handler
		if(!handler) {
			const match = api.replace(/\?.*$/, "")
			for(const handlerKey in API.handlers) {
				const regex = new RegExp(handlerKey.replace(/\[\w+\]/g, "[^\\/]*"))
				if(!match.match(regex)) continue
				handler = API.handlers[handlerKey]
				break
			}
		}

		if(!handler) throw new Error(`API handler not found for ${api}`)

		const request = async function() {
			console.log("Executing API handler", api)

			// Clone handler for modifying
			handler = {...handler, api}

			// Create POST data from META and handler data
			data = {...META, ...data, ...handler.data}

			const elements = element ? [element] : []
			const formData = {}

			handler.form ||= element?.getAttribute("form")
			if(handler.form) {
				// Find form container element
				let formContainer
				if(handler.form instanceof HTMLElement) {
					formContainer = handler.form
				} else if(typeof handler.form == "function") {
					formContainer = handler.form(element)
				} else {
					formContainer = document.getElementById(handler.form)
				}
				if(!formContainer) {
					throw new Error(`Form not found for API handler ${api}`)
				}
				for(const formElement of formContainer.querySelectorAll("[name]") || []) {
					// Skip already found element
					if(elements.includes(formElement)) continue
					
					// Skip elements in embedded dialogs
					let skipElement = false
					for(const parentElement of formElement.parentElementChain) {
						if(parentElement == formContainer) break
						if(parentElement.matches("dialog")) {
							skipElement = true
							break
						}
					}
					if(skipElement) continue

					elements.push(formElement)
				}
			}

			for(const formElement of elements) {
				let elementValue = formElement.value
				if(!elementValue && formElement.matches("[contenteditable]")) {
					elementValue = formElement.innerText.trim()
				}
				
				// Clear validity
				formElement.classList.remove("invalid")

				if(formElement.matches("[type=checkbox], [type=radio]")) {
					// Default value for checkboxes
					if(formElement.checked) {
						if(!formElement.hasAttribute("value")) elementValue = true

					// Ensure required checkboxes are checked
					} else if(formElement.required) {
						formElement.classList.add("invalid")
						return

					// Not checked - skip element
					} else {
						continue
					}
				}

				else if(formElement.matches("[type=file]")) {
					const files = formElement.files
					if(files.length == 0) {
						if(formElement.required) {
							formElement.classList.add("invalid")
							return
						} else {
							continue
						}
					}
					elementValue = []
					for(const file of files) {
						if(file.size > 8 * 1024 * 1024) {
							formElement.classList.add("invalid")
							return
						}
						elementValue.push({
							name: file.name,
							data: await fileToBase64(file)
						})
					}
				}


				if(
					// Ensure required fields are filled
					(formElement.required && !elementValue) ||
					// Check element validity
					formElement.checkValidity && !formElement.checkValidity()
				) {
					formElement.classList.add("invalid")
					return
				}

				const valueKey = formElement.getAttribute("name") || handler.valueKey || "value"
				// If an element with this name was already encountered, turn value into an array
				if(formData[valueKey]) {
					if(!Array.isArray(formData[valueKey])) {
						formData[valueKey] = [formData[valueKey]]
					}
					formData[valueKey].push(elementValue)
				} else {
					formData[valueKey] = elementValue
				}
			}

			data = {...data, ...formData}

			// Trigger data validation callback
			if(handler.validate) {
				const validationResponse = await handler.validate(data, element)
				if(!validationResponse) {
					for(const formElement of elements) {
						formElement.classList.add("invalid")
					}
					return
				}
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
			if(handler.before && !await handler.before(data, element)) return

			// Show loading message
			let progressMessage
			if(handler.progressText) {
				progressMessage = Popup.create({
					message: handler.progressText,
					type: "progress",
					icon: "progress_activity",
				})
			}

			// Disable elements during API call
			for(const element of elements) {
				// Skip focused elements, unless button
				if(element == document.activeElement && !element.matches("button")) continue
				
				element.disabled = true
				element.classList.add("loading")
				element.classList.remove("invalid")
			}

			if(Object.isEmpty(data)) data = undefined
			try {
				await API.onRequestStart?.()
				var response = await API.request(handler.api, data)

				// Trigger "after" callback
				await handler.after?.(response, data, element)
				await API.onRequestSuccess?.()
			} catch(error) {
				if(progressMessage) progressMessage.close()
				elements.forEach(e => e.classList.add("invalid"))
				await handler.error?.(response, data, element)
				await API.onRequestError?.(error)
				throw error
			} finally {
				await API.onRequestEnd?.()
				if(progressMessage && !handler.persistProgress) progressMessage.close()
				// Re-enable elements
				for(const element of elements) {
					element.disabled = false
					element.classList.remove("loading")
				}
			}

			// Update element modified state
			for(const formElement of elements) {
				const valueKey = formElement.getAttribute("name") || handler.valueKey || "data"
				if(response[valueKey] !== undefined) {
					formElement.value = response[valueKey]
				}
				formElement.initialValue = formElement.value
				formElement.modified = false
			}

			// Show success message
			if(handler.successText) {
				Popup.success(handler.successText)
			}

			// Track data updates
			for(const key in API.dataUpdateKeys) {
				const type = API.dataUpdateKeys[key]
				const id = data?.[key] || response?.[key] || META?.[key]
				if(!id) continue
				trackDataUpdate(type, id)
			}

			// Trigger data refresh
			if(handler.refresh === false) return	
			if(handler.refresh == "all") {
				window.top.channel?.postMessage({event: "refresh"})
			}
			if(window.top.unloading) {
				window.top.refreshDataOnShow = true
			} else {
				await window.top.refreshPageData()
			}
		}

		// Add request to queue
		let completionPromiseResolver
		this.executionQueue.push({
			element,
			api,
			request,
			promise: new Promise(resolve => completionPromiseResolver = resolve)
		})
		
		// If queue contains other requests, wait for them to finish
		if(this.executionQueue.length > 1) {
			const previousRequest = this.executionQueue[this.executionQueue.length - 2]
			await previousRequest.promise
		}
		
		try {
			// Execute this request
			return await request()
		} finally {
			// Resolve promise
			completionPromiseResolver()
			// Remove from queue
			this.executionQueue.shift()
		}
	}
}

// API attribute system
function processAPIAttributes() {
	for (const element of window.APIElements || []) {
		if(element.removeAPI) element.removeAPI()
	}
	window.APIElements = []
	
	for(const element of document.querySelectorAll("[api]")) {
		const api = element.getAttribute("api")
		
		let event
		if(element.matches("button")) event = "click"
		else if(element.matches("input[type=checkbox]")) event = "change"
		else if(element.matches("input[type^=date]")) event = "blur"
		else if(element.matches("input")) event = "submit"
		else if(element.matches("select")) event = "change"
		else if(element.matches("textarea")) event = "change"
		else if(element.matches("[contenteditable=plaintext-only]")) event = "blur"
		else {
			console.warn("API attribute not supported for this element:\n", element)
			continue
		}
		const listener = () => API.executeHandler(element, api)
		element.addEventListener(event, listener)
		element.removeAPI = () => element.removeEventListener(event, listener)
		window.APIElements.push(element)
	}
}
processAPIAttributes()
window.afterDataRefresh.push(processAPIAttributes)

let urlDialogs = []
function createURLDialog(url, open=false, closeOnRefresh=false) {
	let iframe, dialog = document.querySelector(`dialog.frame[data-url="${url}"]`)

	// Get existing dialog
	if(dialog) {
		iframe = dialog.querySelector("iframe")
	
	// Create new dialog
	} else {
		dialog = document.createElement("dialog")
		dialog.classList.add("frame")
		dialog.dataset.url = url

		const spinner = document.createElement("i")
		spinner.innerText = "progress_activity"
		spinner.classList.add("spin")
		dialog.append(spinner)

		iframe = document.createElement("iframe")
		dialog.append(iframe)
		
		dialog.addEventListener("open", () => {
			if(!iframe.getAttribute("src")) iframe.src = url
		})
		
		document.body.append(dialog)

		urlDialogs.push(dialog)
	}

	dialog.closeOnRefresh = closeOnRefresh

	iframe.onload = async () => {
		await sleep(250)
		if(iframe.classList.contains("loaded")) return
		if(!iframe.getAttribute("src")) return
		
		const errorElement = iframe.contentDocument?.querySelector("main h2")
		let errorText = errorElement?.textContent || "Błąd ładowania strony"
		Popup.error(errorText)
		dialog.close()

		await sleep(250)
		dialog.remove()
		processDialogOpeners()
	}

	if(open) dialog.result()
	return dialog
}

// "opens-dialog" attribute
function processDialogOpeners() {
	// Remove all URL dialogs
	urlDialogs = urlDialogs.filter(dialog => {
		if(dialog.open && !dialog.closeOnRefresh) return true
		if(dialog.closeOnRefresh) {
			dialog.close()
			sleep(250).then(() => dialog.remove())
		} else {
			dialog.remove()
		}
		return false
	})
	
	for(const opener of window.dialogOpeners || []) {
		if(opener.removeDialogOpener) opener.removeDialogOpener()
	}
	window.dialogOpeners = []
	
	for(const element of document.querySelectorAll("[opens-dialog]")) {
		const dialogID = element.getAttribute("opens-dialog")

		// URL mode
		if(dialogID.startsWith("/")) {
			const dialog = createURLDialog(dialogID)
			
			element.onclick = async () => {
				dialog.result()
			}

			element.removeDialogOpener = () => {
				element.onclick = undefined
			}


		// Dialog mode
		} else {		
			const dialog = document.getElementById(dialogID)
			if(!dialog) {
				console.warn(`Dialog with ID ${dialogID} not found for element`, element)
				continue
			}

			element.onclick = () => dialog.result()
			element.removeDialogOpener = () => element.onclick = undefined

		}

		window.dialogOpeners.push(element)
	}
}
processDialogOpeners()
window.afterDataRefresh.push(processDialogOpeners)

// Custom input fields
function processCustomInputElements() {
	for(const input of document.querySelectorAll("input")) {
		// Skip if input has already been modified
		if(input.customised) continue
		input.customised = true
		
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
			if(!input.modified) {
				input.classList.remove("invalid")
				return
			}
			input.dispatchEvent(new Event("submit"))
		})
		
		// Custom date input
		if(input.matches("[type^=date]")) {
			input.addEventListener("keydown", event => input.lastKeyboardInputTime = event.timeStamp)
			
			input.addEventListener("change", event => {
				if(!input.value) return
				input.lastKeyboardInputTime ||= 0
				// If last keyboard input was over 100ms ago, assume change was caused by date picker
				if(event.timeStamp - input.lastKeyboardInputTime < 100) return
				// Stupid hack for mobile Chrome
				const newInput = document.createElement("input")
				input.insertAdjacentElement("afterend", newInput)
				newInput.focus()
				newInput.remove()
			})
		}

		// Custom checkbox
		else if(input.matches("input[type=checkbox]")) {
			input.globalCheckbox = element => {
				let checkboxes = (element instanceof HTMLElement) ?
					element.querySelectorAll("input[type=checkbox]") :
					element
				// Remove self from list
				checkboxes = Array.from(checkboxes).filter(c => c != input)
				
				input.onchange = async () => {
					for(const checkbox of checkboxes) {
						if(checkbox.disabled) continue
						if(!checkbox.checkVisibility()) continue
						// await sleep(150 / checkboxes.length)
						checkbox.checked = input.checked
					}
					// Trigger change event 
					if(element instanceof HTMLElement) {
						element.dispatchEvent(new Event("change"))
					}
				}

				input.calculateState = () => {
					input.checked = false
					input.indeterminate = false
					let allChecked = true
					for(const checkbox of checkboxes) {
						if(checkbox.disabled) continue
						if(!checkbox.checkVisibility()) continue
						if(checkbox.checked) {
							input.indeterminate = true
						} else {
							allChecked = false
						}
					}
					if(allChecked) {
						input.checked = true
						input.indeterminate = false
					}
				}
				input.calculateState()

				for(const checkbox of checkboxes) {
					checkbox.addEventListener("change", input.calculateState)
				}
			}
		}

		// Custom file input
		else if(input.matches("input[type=file]")) {
			input.addEventListener("change", () => {
				for(const file of input.files) {
					if(file.size > 8 * 1024 * 1024) {
						throw `Plik ${file.name} jest zbyt duży (maks. 8 MB)`
						input.value = ""
						break
					}
				}
			})
		}
	}
}
processCustomInputElements()
window.afterDataRefresh.push(processCustomInputElements)

// Disable form elements
function disableForms() {
	for(const form of document.querySelectorAll("form")) {
		form.onsubmit = event => {
			event.preventDefault()
		}
	}
}
disableForms()
window.afterDataRefresh.push(disableForms)

// Link buttons
function linkButton(button) {
	const a = document.createElement("a")
	a.href = button.getAttribute("href")
	if(button.hasAttribute("target")) {
		a.target = button.getAttribute("target")
	}
	button.removeAttribute("href")
	button.removeAttribute("target")
	button.insertAdjacentElement("beforebegin", a)
	button.tabIndex = -1
	a.append(button)
}
function processLinkButtons() {
	document.querySelectorAll("button[href]").forEach(linkButton)
}
processLinkButtons()
window.afterDataRefresh.push(processLinkButtons)

// Make all element IDs globally accessible
function processCustomIDs() {
	for(const element of document.querySelectorAll("[id]")) {
		const replacer = r => r.toUpperCase().replace("-", "")
		const id = element.id.replaceAll(/-\w/g, replacer)
		if(window[id]) continue
		window[id] = element
	}
	window["main"] ||= document.querySelector("main")
}
processCustomIDs()
window.afterDataRefresh.push(processCustomIDs)

// Reusable JSON store wrapper
class Store {
	constructor(source) {
		const store = this
		this.source = source

		const proxyHandler = {
			get(target, property) {
				const rawData = target.source.getItem(property)
				if(rawData === null) return
				try {
					var parsedData = JSON.parse(rawData)
				} catch {
					return rawData
				}
				// Proxy objects for detecting updates
				if(parsedData instanceof Object) {
					const objectProxyHandler = {
						get(target, key) {
							const value = target[key]
							if(value instanceof Object && key != "prototype") {
								return new Proxy(value, objectProxyHandler)
							}
							return value
						},
						set(target, arrayPropery, arrayValue) {
							target[arrayPropery] = arrayValue
							proxyHandler.set(store, property, parsedData)
							return true
						}
					}
					return new Proxy(parsedData, objectProxyHandler)
				}
				return parsedData
			},
			set(target, property, value) {
				if(value === undefined) {
					target.source.removeItem(property)
					return true
				}
				value = JSON.stringify(value)
				target.source.setItem(property, value)
				return true
			}
		}
		return new Proxy(this, proxyHandler)
	}
}

const Local = new Store(localStorage)
const Session = new Store(sessionStorage)

// Keep track of updates in session storage
function trackDataUpdate(type, id) {
	Session.updates ||= {}
	Session.updates[type] ||= {}
	Session.updates[type][id] = Date.now()
}

// META tag system
const META = {}
window.META = META
function processMetaTags() {
	for(const metaTag of document.querySelectorAll("meta[name]:not([name=viewport])")) {
		let metaContent = metaTag.content
		if(metaTag.hasAttribute("static")) continue
		if(metaTag.hasAttribute("base64")) {
			metaContent = Base64.decode(metaContent)
			metaContent = JSON.parse(metaContent)
		}
		META[metaTag.name] = metaContent
	}
}
processMetaTags()
window.afterDataRefresh.push(processMetaTags)

// Prevent frames
if(window.top != window && !document.body.classList.contains("allow-frames")) {
	document.documentElement.hidden = true
	console.warn("Frame detected, attempting to exit...")
	if(!META.error) window.top.location = location
}