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
	if(input.matches("[type=text]")) {
		input.addEventListener("keypress", event => {
			if(event.key == "Enter") input.blur()
		})
		input.addEventListener("blur", event => {
			input.onsubmit?.()
		})
	}
	if(input.matches("[type=date]")) {
		input.addEventListener("change", event => {
			if(!input.value || input.matches(":focus")) return
			input.blur()
		})
		input.addEventListener("keypress", event => {
			if(event.key == "Enter") input.blur()
		})
		input.addEventListener("blur", event => {
			input.onsubmit?.()
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
	a.append(button)
}
