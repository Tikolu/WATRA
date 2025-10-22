API.registerHandler("login", {
	progressText: "Logowanie...",
	validate: data => {
		data.accessCode = data.accessCode.replaceAll(" ", "")
		return !!data.accessCode
	},
	after: () => document.location.href = "/"
})