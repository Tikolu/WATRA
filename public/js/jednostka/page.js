API.registerHandler("jednostka/[jednostkaID]/update/name", {
	valueKey: "name",
	successText: "Zapisano nazwę"
})

API.registerHandler("jednostka/[jednostkaID]/member/create", {
	progressText: "Tworzenie użytkownika...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/users/${response.userID}`
	}
})