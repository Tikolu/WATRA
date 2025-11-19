API.registerHandler("login/accessCode", {
	progressText: "Logowanie...",
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