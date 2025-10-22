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

API.registerHandler("user/[userID]/accessCode/generate", {
	progressText: "Generowanie kodu dostępu...",
	after: response => {
		// Format access code
		const accessCode = response.accessCode.replace(/(\d{4})/g, "$1 ").trim()
		
		userAccessCodeContainer.value = accessCode
		accessCodeDialog.result()
	}
})

API.registerHandler("user/[userID]/parent/create", {
	progressText: "Tworzenie rodzica...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/users/${response.userID}`
	}
})