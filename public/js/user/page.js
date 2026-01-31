API.registerHandler("user/[userID]/update/names", {
	successText: "Zapisano imię i nazwisko"
})

API.registerHandler("user/[userID]/update/dateOfBirth", {
	valueKey: "date",
	successText: "Zapisano datę urodzenia"
})

API.registerHandler("user/[userID]/update/email", {
	valueKey: "email",
	successText: "Zapisano adres e-mail"
})

API.registerHandler("user/[userID]/update/phone", {
	valueKey: "phone",
	successText: "Zapisano numer telefonu"
})

API.registerHandler("user/[userID]/delete", {
	progressText: "Kasowanie użytkownika...",
	before: () => deleteUserDialog.result(),
	after: () => history.back()
})

API.registerHandler("user/[userID]/parent/create", {
	progressText: "Tworzenie rodzica...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/users/${response.userID}`
	}
})

API.registerHandler("user/[userID]/confirm", {
	form: "signature-form",
	progressText: "Zatwierdzanie...",
	successText: "Zatwierdzono",
	error: () => {
		signature.reset()
	}
})

API.registerHandler("user/[userID]/unconfirm", {
	progressText: "Cofanie zatwierdzenia...",
	successText: "Cofnięto zatwierdzenie"
})

API.registerHandler("passkey/create", {
	progressText: "Tworzenie klucza dostępu...",
	after: async (response, data, element) => {
		let passkeyStartTime = 0
		try {
			const publicKey = PublicKeyCredential.parseCreationOptionsFromJSON(response.creationOptions)
			passkeyStartTime = Date.now()
			var credential = await navigator.credentials.create({publicKey})
			if(!credential) throw new Error("Null credential returned")
		} catch(error) {
			console.error(error)
			logError(error)
			if(Date.now() - passkeyStartTime > 500) {
				Popup.error("Anulowano tworzenie klucza")
			} else {
				Popup.error("Twoja przeglądarka internetowa odrzuciła próbę utworzenia klucza dostępu. Spróbuj użyć innej przeglądarki.")
			}
			return
		}

		API.executeHandler(element, "passkey/save", {
			credential: credential.toJSON()
		})
	}
})

API.registerHandler("passkey/save", {
	progressText: "Zapisywanie klucza dostępu...",
	successText: "Zapisano klucz dostępu!",
	error: async (response, data) => {
		await deleteCredential(data.credential.id)
	}
})

API.registerHandler("passkey/[passkeyID]/delete", {
	progressText: "Usuwanie klucza dostępu...",
	successText: "Usunięto klucz dostępu",
	before: () => deletePasskeyDialog.result(),
	after: async response => {
		await deleteCredential(response.passkeyID)
	}
})

async function deleteCredential(id) {
	try {
		await PublicKeyCredential.signalUnknownCredential?.({
			rpId: window.location.hostname,
			credentialId: id
		})
	} catch(error) {
		sleep(500).then(() => {
			Popup.create({
				message: "Twoja przeglądarka nie obsługuje automatycznego kasowania kluczy dostępu i należy go ręcznie usunąć w ustawieniach",
				time: false,
				type: "error",
				icon: "warning"
			})
		})
	}
}

API.registerHandler("logout", {
	progressText: "Wylogowywanie...",
	refresh: "all",
	data: {
		userID: undefined
	}
})