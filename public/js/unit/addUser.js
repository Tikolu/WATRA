API.registerHandler("unit/[unitID]/member/create", {
	form: createUser,
	progressText: "Tworzenie użytkownika...",
	after: (response, data) => {
		window.top.createURLDialog(`/users/${response.userID}/accessCode?parent=${data.createParent || ""}`, true)
	}
})

API.registerHandler("unit/[unitID]/member/[userID]/add", {
	form: linkUser,
	progressText: "Dodawanie użytkownika...",
	successText: "Dodano użytkownika"
})

unitSelect.onchange = () => {
	orgSelect.disabled = false
	const targetOrg = unitSelect.selectedOptions[0].dataset.org
	if(targetOrg) {
		orgSelect.value = targetOrg
		orgSelect.disabled = true
	}
}

userPicker.onchange = () => linkUserButton.scrollIntoView({behavior: "smooth"})
userPickerSearch.onclick = () => linkUserButton.scrollIntoView({behavior: "smooth"})