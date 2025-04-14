userCodeInput.onsubmit = async event => {
	const accessCode = userCodeInput.value
	if(!accessCode) return

	try {
		var response = await API("login", {accessCode})
	} catch(error) {
		Popup.error(error)
		return
	}

	document.location.href = "/"
}