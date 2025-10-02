API.registerHandler("login", {
	progressText: "Weryfikowanie...",
	after: () => document.location.reload()
})

verificationPlaceholder.click()