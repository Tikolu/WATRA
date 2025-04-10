verificationPlaceholder.onchange = async () => {
	verificationPlaceholder.disabled = true
	try {
		var response = await API("login", {userID: META.userID})
	} catch(error) {
		verificationPlaceholder.disabled = false
		verificationPlaceholder.checked = false
		Popup.error(error)
		return
	}

	document.location.href = "/"
}