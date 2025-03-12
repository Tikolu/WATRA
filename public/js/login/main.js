userCodeInput.oninput = async () => {
	const accessCode = userCodeInput.value
	if(accessCode.length != 8) return

	try {
		var response = await API("login", {accessCode})
	} catch(error) {
		alert(error)
		return
	}

	document.location.href = "/"
}