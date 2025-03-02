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
	let response
	try {
		response = await fetch(`/api/${get}`, options)
	} catch(error) { }
	let text = await response.text()
	let json
	try {
		json = JSON.parse(text)
	} catch(error) {
		throw new Error("Error parsing API response")
	}
	if(json.error) {
		throw new Error(json.error.message)
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