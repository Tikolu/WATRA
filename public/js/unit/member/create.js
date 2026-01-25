API.registerHandler("unit/[unitID]/member/create", {
	form: main,
	progressText: "Tworzenie użytkownika...",
	after: (response, data) => {
		if(data.accessType == "newParent") {
			window.top.createURLDialog(`/users/${response.userID}/accessCode?parent=true`, true)
		}
		
		else if(data.accessType == "linkParent") {
			window.top.createURLDialog(`/users/${response.userID}/addParent?action=link`, true)
		}

		else if(data.accessType == "direct") {
			window.top.createURLDialog(`/users/${response.userID}/accessCode`, true)
		}
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