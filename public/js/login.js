API.registerHandler("login/accessCode", {
	progressText: "Logowanie...",
	validate: data => {
		data.accessCode = data.accessCode.replaceAll(" ", "")
		return !!data.accessCode
	},
	after: () => document.location.href = "/"
})

API.registerHandler("login/getKeys", {
	progressText: "Logowanie...",
	after: async (response, data, element) => {
		if(response.loggedIn) {
			Popup.success("Zalogowano!")
			top.refreshPageData()
			window.dialog?.fullClose()
			return
		}
		
		try {
			var credential = await top.navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(response.options)
			})
		} catch(error) {
			console.error(error)
			throw "Anulowano logowanie"
		}

		API.executeHandler(element, "login/verify", {
			credential: credential.toJSON(),
			userID: response.userID
		})
	}
})

API.registerHandler("login/verify", {
	progressText: "Logowanie...",
	successText: "Zalogowano!",
	after: () => {
		top.refreshPageData()
		window.dialog?.fullClose()
	}
})

API.registerHandler("logout", {
	progressText: "Usuwanie z listy...",
	before: (data, element) => {
		if(!("warning" in element.dataset)) return true

		return fullLogoutWarning.result()
	}
})