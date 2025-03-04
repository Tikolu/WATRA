jednostkaAddUserOptions.onclick = async event => {
	if(!event.target.matches("button")) return
	const userID = event.target.dataset.userId
	
	event.target.disabled = true
	try {
		await API(`jednostka/${META.jednostkaID}/addMember`, {userID})
	} catch(error) {
		event.target.disabled = false
		alert(error)
		return
	}

	event.target.innerText = "Dodano!"
}

createUserButton.onclick = async () => {
	try {
		var response = await API("user/create")
		await API(`jednostka/${META.jednostkaID}/addMember`, {userID: response.userID})
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}