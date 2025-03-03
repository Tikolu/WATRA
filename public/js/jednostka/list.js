createJednostkaButton.onclick = async () => {
	try {
		var response = await API("jednostka/create")
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/jednostki/${response.jednostkaID}`
}