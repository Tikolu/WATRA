API.registerHandler("login", {
	progressText: "Logowanie...",
	after: () => document.location.reload()
})