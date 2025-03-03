addUserButton.onclick = async () => {
	const userID = prompt("ID użytkownika:")
	if(!userID) return

	try {
		var response = await API(`jednostka/${META.jednostkaID}/addMember`, {userID})
	} catch(error) {
		alert(error)
		return
	}

	document.location.reload()
}

deleteJednostkaButton.onclick = async () => {
	if(!confirm(`Usunąć jednostkę ${jednostkaTitle.innerText}?`)) return
	try {
		var response = await API(`jednostka/${META.jednostkaID}/delete`)
	} catch(error) {
		alert(error)
		return
	}
	history.back()
}
