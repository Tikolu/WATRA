// Global error handlers
window.onerror = message => Popup.error(message)
window.onunhandledrejection = event => Popup.error(event.reason)

// Debug function
function debug() {
	console.log(...arguments)
	if(!Local.debug) return
	for(const arg of arguments) {
		if(typeof arg != "string") arg = JSON.stringify(arg)
		Popup.info(arg, "build")
	}
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

// Popups and dialogs
const Popup = {
	create({message, type, icon, time=3500}) {
		const dialog = document.createElement("dialog")
		dialog.classList.add("message")
		if(type) dialog.classList.add(type)

		if(icon) dialog.innerHTML = `<i>${icon}</i>`
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
}

// Custom refresh functionality
async function refreshPageData() {
	await sleep(50)
	if(window.refreshing || window.unloading) return
	window.refreshing = true
	debug("Refreshing page data...")
	
	const response = await fetch(document.location)
	if(!response.ok) {
		// Reload on error
		document.location.reload()
		return
	}
	const body = await response.text()

	const parser = new DOMParser()
	const newDocument = parser.parseFromString(body, "text/html")

	const ignoreElements = "dialog.message"
	const ignoreAttributes = {
		"dialog": ["open"],
		"details": ["open"],
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

		// Update attributes
		for(const attr of newDoc.attributes || []) {
			if(oldDoc.getAttribute(attr.name) === attr.value) continue
			oldDoc.setAttribute(attr.name, attr.value)
		}
		// Remove old attributes
		const ignoreAttrs = ignoreAttributes[Object.keys(ignoreAttributes).find(q => oldDoc.matches && oldDoc.matches(q))] || []
		for(const attr of oldDoc.attributes || []) {
			if(ignoreAttrs.includes(attr.name)) continue
			if(!newDoc.hasAttribute(attr.name)) {
				oldDoc.removeAttribute(attr.name)
			}
		}

		// Update text content if different
		if(
			!oldDoc.childElementCount &&
			!newDoc.childElementCount &&
			oldDoc.textContent !== newDoc.textContent
		) {
			oldDoc.textContent = newDoc.textContent
			return
		}

		// Merge child elements
		const oldChildren = [...oldDoc.children].filter(nodeFilter).map(nodeMap)
		const newChildren = [...newDoc.children].filter(nodeFilter).map(nodeMap)

		const elementsToAdd = []

		for(const newChildIndex in newChildren) {
			const newChild = newChildren[newChildIndex]
			let matchingElement, matchStrength = 0

			// Find old element which most closely matches new element
			for(const oldChildIndex in oldChildren) {
				const oldChild = oldChildren[oldChildIndex]
				if(elementsToAdd.includes(oldChild)) continue
				if(!oldChild.matches(newChild.tagName)) continue

				// Perfect matches
				if(oldChild.isEqualNode(newChild)) {
					matchingElement = oldChild
					break
				}
				if(oldChild.id && oldChild.id == newChild.id) {
					matchingElement = oldChild
					break
				}
				
				// Alternative matches
				let elementMatchStrength = 0
				if(oldChild.href == newChild.href) elementMatchStrength += 1
				if(oldChild.className == newChild.className) elementMatchStrength += 1
				if(oldChildIndex == newChildIndex) elementMatchStrength += 1
				if(oldChild.textContent == newChild.textContent) elementMatchStrength += 1

				if(elementMatchStrength > matchStrength) {
					matchStrength = elementMatchStrength
					matchingElement = oldChild
				} else if(!matchingElement) {
					matchingElement = oldChild
				}
			}

			if(matchingElement) {
				elementsToAdd.push(matchingElement)
				mergeDocuments(matchingElement, newChild)
			} else {
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
			oldDoc.append(newChild)

			if(!newChild.matches(noAnimate) && elementIndex == -1) (async () => {
				newChild.classList.add("adding")
				await sleep(250)
				newChild.classList.remove("adding")
			})()
		}
	}

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
		funkcjaID: "funkcje",
		jednostkaID: "jednostki",
		userID: "users",
		wyjazdID: "wyjazdy"
	},

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
			throw json.error.message.replace(/^Error: /, "")
		}
		return json
	},

	registerHandler(api, handler) {
		if(api in this.handlers) {
			throw new Error(`API handler already registered for ${api}`)
		}
		this.handlers[api] = handler
	},

	async executeHandler(element, api) {
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
		await handler.after?.(response, data)

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

		// Track data updates
		for(const key in API.dataUpdateKeys) {
			const type = API.dataUpdateKeys[key]
			const id = data?.[key] || response?.[key] || META?.[key]
			if(!id) continue
			trackDataUpdate(type, id)
		}

		// Trigger data refresh
		if(handler.refresh !== false) {
			await refreshPageData()
		}
	}
}

// API attribute system
function processAPIAttributes() {
	for(const element of document.querySelectorAll("[api]")) {
		if(element.removeAPI) element.removeAPI()

		const api = element.getAttribute("api")
		
		let event
		if(element.matches("button")) event = "click"
		else if(element.matches("input[type=checkbox]")) event = "change"
		else if(element.matches("input")) event = "submit"
		else if(element.matches("select")) event = "change"
		else {
			console.warn("API attribute not supported for this element:\n", element)
			continue
		}
		const listener = () => API.executeHandler(element, api)
		element.addEventListener(event, listener)
		element.removeAPI = () => element.removeEventListener(event, listener)
	}
}
processAPIAttributes()
window.afterDataRefresh.push(processAPIAttributes)

// Custom input fields
function processCustomInputElements() {
	for(const input of document.querySelectorAll("input")) {
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
	button.removeAttribute("href")
	button.insertAdjacentElement("beforebegin", a)
	button.tabIndex = -1
	a.append(button)
}
document.querySelectorAll("button[href]").forEach(linkButton)

// Make all element IDs globally accessible
function processCustomIDs() {
	for(const element of document.querySelectorAll("[id]")) {
		const replacer = r => r.toUpperCase().replace("-", "")
		const id = element.id.replaceAll(/-\w/g, replacer)
		if(window[id]) continue
		window[id] = element
	}
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
function processMetaTags() {
	for(const metaTag of document.querySelectorAll("meta[name]:not([name=viewport])")) {
		let metaContent = metaTag.content
		if(metaTag.hasAttribute("base64")) {
			metaContent = Base64.decode(metaContent)
			metaContent = JSON.parse(metaContent)
		}
		META[metaTag.name] = metaContent
	}
}
processMetaTags()
window.afterDataRefresh.push(processMetaTags)