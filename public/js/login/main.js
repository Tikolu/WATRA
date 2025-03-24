userCodeInput.onsubmit = async event => {
	const accessCode = userCodeInput.value

	try {
		var response = await API("login", {accessCode})
	} catch(error) {
		alert(error)
		return
	}

	document.location.href = "/"
}