userCodeInput.oninput = async () => {
	const code = userCodeInput.value
	if(code.length != 8) return

	try {
		var response = await API("login", {code})
	} catch(error) {
		alert(error)
		return
	}

	document.location.href = "/"
}