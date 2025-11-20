API.registerHandler("login/getKeys", {
	progressText: "Logowanie...",
	after: async (response, data, element) => {
		if(response.loggedIn) {
			Popup.success("Zalogowano!")
			window.top.channel?.postMessage({event: "refresh"})
			window.top.refreshPageData()
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
	refresh: "all",
	after: () => {
		window.dialog?.fullClose()
	}
})