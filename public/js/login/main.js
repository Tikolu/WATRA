API.registerHandler("login/accessCode", {
	progressText: "Logowanie...",
	validate: data => {
		data.accessCode = data.accessCode.replaceAll(" ", "")
		return !!data.accessCode
	},
	refresh: false,
	after: () => {
		// Redirect to main page
		window.top.channel?.postMessage({
			event: "navigate",
			path: "/"
		})
		document.location.href = "/"
	}
})

API.registerHandler("logout", {
	progressText: "Usuwanie z listy...",
	successText: "Usunięto z listy",
	before: (data, element) => {
		if(!("warning" in element.dataset)) return true

		return fullLogoutWarning.result()
	}
})

accessCodeInput.oninput = event => {
	// Remove invalid characters
	let newValue = accessCodeInput.value.replaceAll(/[^0-9 ]/g, "")
	// Format access code
	if(event?.inputType == "insertText" && newValue.length == 4) {
		newValue += " "
	}
	
	if(newValue != accessCodeInput.value) accessCodeInput.value = newValue

	// Auto submit
	if(newValue.replaceAll(" ", "").length == 8) API.executeHandler(accessCodeInput)
}

function unsupportedBrowser() {
	if(!document.contains(main)) return
	main.remove()
	Popup.error("Twoja przeglądarka nie jest obsługiwana!\nUżyj Chrome, Edge, Safari lub Firefox")
	sleep(4000).then(() => history.back())
}

// Check for CSS compatability
sleep(1000).then(() => {
	const style = window.getComputedStyle(main)
	if(style.display != "block") return unsupportedBrowser()

	accessCodeInput.oninput()
})

// Check for passkey support
if(!window.PublicKeyCredential?.parseRequestOptionsFromJSON) {
	unsupportedBrowser()
}

// Remove access code from URL
history.replaceState(null, null, window.location.pathname)