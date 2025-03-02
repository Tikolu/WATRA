createUserButton.onclick = async () => {
	try {
		var response = await API("user/create")
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}