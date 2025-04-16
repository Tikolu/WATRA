// Make all element IDs globally accessible
for(const element of document.querySelectorAll("[id]")) {
	const replacer = r => r.toUpperCase().replace("-", "")
	const id = element.id.replaceAll(/-\w/g, replacer)
	if(window[id]) continue
	window[id] = element
}

// API function
async function API(get="", post=undefined) {
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

// Custom input fields
for(const input of document.querySelectorAll("input")) {
	input.initialValue = input.value
	input.modified = false
	input.addEventListener("input", () => {
		input.modified = input.value != input.initialValue
	})
	input.addEventListener("submit", () => {
		input.initialValue = input.value
		input.modified = false
	})
	input.addEventListener("keypress", event => {
		if(event.key != "Enter") return
		input.dispatchEvent(new Event("submit"))
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
}