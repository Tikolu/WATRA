createUserButton.onclick = async () => {
	createUserButton.disabled = true
	try {
		var response = await API("user/create")
	} catch(error) {
		createUserButton.disabled = false
		alert(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}