API.registerHandler("unit/[unitID]/member/create", {
	form: main,
	progressText: "Tworzenie użytkownika...",
	after: response => {
		window.top.createURLDialog(`/users/${response.userID}/accessCodes`, true)
	}
})

unitSelect.onchange = () => {
	orgSelect.disabled = false
	const targetOrg = unitSelect.selectedOptions[0].dataset.org
	if(targetOrg) {
		orgSelect.value = targetOrg
		orgSelect.disabled = true
	}
}