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
	updateName()
}

lastNameInput.onblur = async () => {
	updateName()
}