API.registerHandler("login", {
	progressText: "Weryfikowanie...",
	after: () => document.location.reload()
})