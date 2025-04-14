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
	return true
}

firstNameInput.onsubmit = async () => {
	firstNameInput.disabled = true
	firstNameInput.classList.remove("invalid")
	if(await updateName()) Popup.success("Zapisano imię")
	else firstNameInput.classList.add("invalid")
	firstNameInput.disabled = false
}

lastNameInput.onsubmit = async () => {
	lastNameInput.disabled = true
	lastNameInput.classList.remove("invalid")
	if(await updateName()) Popup.success("Zapisano nazwisko")
	else lastNameInput.classList.add("invalid")
	lastNameInput.disabled = false
}

dateOfBirthInput.onsubmit = async () => {
	if(dateOfBirthInput.disabled) return
	dateOfBirthInput.disabled = true
	dateOfBirthInput.classList.remove("invalid")
	try {
		var response = await API(`user/${META.userID}/update/dateOfBirth`, {
			date: dateOfBirthInput.value
		})
	} catch(error) {
		dateOfBirthInput.classList.add("invalid")
		Popup.error(error)
		return
	} finally {
		dateOfBirthInput.disabled = false
	}
	Popup.success("Zapisano datę urodzin")
}

if(this.deleteUserButton) deleteUserButton.onclick = async () => {
	if(!await deleteUserDialog.result()) return
	const progressMessage = Popup.info("Kasowanie użytkownika...")
	deleteUserButton.disabled = true
	try {
		var response = await API(`user/${META.userID}/delete`)
	} catch(error) {
		deleteUserButton.disabled = false
		progressMessage.close()
		Popup.error(error)
		return
	}
	history.back()
}

if(this.generateAccessCodeButton) generateAccessCodeButton.onclick = async () => {
	const progressMessage = Popup.info("Generowanie kodu dostępu...")
	generateAccessCodeButton.disabled = true
	try {
		var response = await API(`user/${META.userID}/accessCode/generate`)
	} catch(error) {
		Popup.error(error)
		return
	} finally {
		progressMessage.close()
		generateAccessCodeButton.disabled = false
	}

	// Format access code
	const accessCode = response.accessCode.replace(/(\d{4})/g, "$1 ").trim()
	
	accessCodeContainer.value = accessCode
	accessCodeDialog.result()
}

if(this.addParentButton) addParentButton.onclick = async () => {
	const progressMessage = Popup.info("Tworzenie rodzica...")
	try {
		var response = await API(`user/${META.userID}/parent/create`)
	} catch(error) {
		progressMessage.close()
		Popup.error(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}