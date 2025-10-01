API.registerHandler("jednostka/[jednostkaID]/member/create", {
	progressText: "Tworzenie użytkownika...",
	after: response => {
		window.top.createURLDialog(`/users/${response.userID}/accessCodes`, true)
	}
})