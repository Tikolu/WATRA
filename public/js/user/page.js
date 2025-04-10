async function updateName() {
	try {
		var response = await API(`user/${META.userID}/update/name`, {
			first: firstNameInput.value,
			last: lastNameInput.value
		})
	} catch(error) {
		Popup.error(error)
		return
	}
	firstNameInput.value = response.first
	lastNameInput.value = response.last
	userTitle.innerText = response.display
}

firstNameInput.onsubmit = async () => {
	firstNameInput.disabled = true
	await updateName()
	firstNameInput.disabled = false
}

lastNameInput.onsubmit = async () => {
	lastNameInput.disabled = true
	await updateName()
	lastNameInput.disabled = false
}

dateOfBirthInput.onsubmit = async () => {
	if(dateOfBirthInput.disabled) return
	dateOfBirthInput.disabled = true
	try {
		var response = await API(`user/${META.userID}/update/dateOfBirth`, {
			date: dateOfBirthInput.value
		})
	} catch(error) {
		Popup.error(error)
		return
	} finally {
		dateOfBirthInput.disabled = false
	}
}

if(this.deleteUserButton) deleteUserButton.onclick = async () => {
	if(!confirm(`Usunąć użytkownika ${userTitle.innerText}?`)) return
	try {
		var response = await API(`user/${META.userID}/delete`)
	} catch(error) {
		Popup.error(error)
		return
	}
	history.back()
}

if(this.generateAccessCodeButton) generateAccessCodeButton.onclick = async () => {
	try {
		var response = await API(`user/${META.userID}/accessCode/generate`)
	} catch(error) {
		Popup.error(error)
		return
	}
	Popup.error(`Jednorazowy kod dostępu:\n${response.accessCode}`)
}

if(this.addParentButton) addParentButton.onclick = async () => {
	try {
		var response = await API(`user/${META.userID}/parent/create`)
	} catch(error) {
		Popup.error(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}