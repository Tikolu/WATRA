async function updateName() {
	try {
		var response = await API(`user/${META.userID}/update/name`, {
			first: firstNameInput.value,
			last: lastNameInput.value
		})
	} catch(error) {
		alert(error)
		return
	}
	firstNameInput.value = response.first
	lastNameInput.value = response.last
	userTitle.innerText = response.display
}

firstNameInput.onblur = async () => {
	firstNameInput.disabled = true
	await updateName()
	firstNameInput.disabled = false
}

lastNameInput.onblur = async () => {
	lastNameInput.disabled = true
	await updateName()
	lastNameInput.disabled = false
}