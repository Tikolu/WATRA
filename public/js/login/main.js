API.registerHandler("login/accessCode", {
	progressText: "Logowanie...",
	refresh: "all",
	validate: data => {
		data.accessCode = data.accessCode.replaceAll(" ", "")
		return !!data.accessCode
	},
	after: () => document.location.href = "/"
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
	const error = "Twoja przeglądarka nie jest obsługiwana!\n\nUżyj nowszej wersji Chrome, Edge, Safari lub Firefox"
	Popup.error(error)
	sleep(1000).then(() => alert(error))
}

// Check for CSS compatability
sleep(1000).then(() => {
	const style = window.getComputedStyle(main)
	if(style.display != "block") return unsupportedBrowser()

	accessCodeInput.oninput()
})

// Check for passkey support
if(!window.PublicKeyCredential) {
	unsupportedBrowser()
}