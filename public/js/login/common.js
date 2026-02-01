API.registerHandler("login/getKeys", {
	progressText: "Logowanie...",
	refresh: false,
	after: async (response, data, element) => {
		if(response.loggedIn) {
			Popup.success("Zalogowano!")

			// Redirect to main page
			window.top.channel?.postMessage({
				event: "navigate",
				path: "/"
			})
			window.top.location.href = "/"
			// Close switcher dialog
			window.dialog?.fullClose()
			
			return
		}

		let credential
		try {
			credential = await top.navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(response.options)
			})
		} catch(error) {
			console.error(error)
			logError(error)
			Popup.error("Anulowano logowanie")
			return
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
	refresh: false,
	after: () => {
		// Redirect to main page
		window.top.channel?.postMessage({
			event: "navigate",
			path: "/"
		})
		window.top.location.href = "/"
		// Close switcher dialog
		window.dialog?.fullClose()
	}
})