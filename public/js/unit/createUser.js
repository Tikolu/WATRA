API.registerHandler("unit/[unitID]/member/create", {
	form: main,
	progressText: "Tworzenie użytkownika...",
	after: response => {
		window.top.createURLDialog(`/users/${response.userID}/accessCodes`, true)
	}
})