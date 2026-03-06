function redirectAfterLogin() {
	if(window.dialog) {
		// If in dialog, refresh pages
		window.top.channel?.postMessage({
			event: "refresh"
		})
		window.top.refreshPageData()
		window.dialog.fullClose()
		return

	} else {
		// Otherwise, redirect to main page
		window.top.channel?.postMessage({
			event: "navigate",
			path: "/"
		})
		window.top.location.href = "/"
	}
}

async function deleteCredential(id) {
	try {
		await PublicKeyCredential.signalUnknownCredential?.({
			rpId: window.location.hostname,
			credentialId: id
		})
	} catch(error) {
		sleep(500).then(() => {
			Popup.create({
				message: "Twoja przeglądarka nie obsługuje automatycznego kasowania kluczy dostępu - należy go ręcznie usunąć w ustawieniach",
				time: false,
				type: "error",
				icon: "warning"
			})
		})
	}
}

API.registerHandler("login/getKeys", {
	progressText: "Logowanie...",
	refresh: false,
	after: async (response, data, element) => {
		if(response.loggedIn) {
			Popup.success("Zalogowano!")

			redirectAfterLogin()
			return
		}

		let credential, passkeyStartTime = Date.now()
		try {
			credential = await top.navigator.credentials.get({
				publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(response.options)
			})
		} catch(error) {
			console.error(error)
			logError(error)
			if(Date.now() - passkeyStartTime < 500) {
				Popup.error("Przeglądarka internetowa odrzuciła próbę logowania. Spróbuj użyć innej przeglądarki.")
			}
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
	after: redirectAfterLogin,
	error: ({error, data}) => {
		// Delete credential if 404 response
		if(error.cause?.code == 404) {
			deleteCredential(data.credential.id)
		}
	}
})