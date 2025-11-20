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

// Autofill access code from URL
const urlHash = decodeURIComponent(window.location.hash)
if(/^#[0-9 ]+$/.test(urlHash)) {
	const accessCode = urlHash.substring(1)
	accessCodeInput.value = accessCode
	accessCodeInput.oninput()
	accessCodeInput.focus()
}