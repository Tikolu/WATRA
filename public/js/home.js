if(this.createWyjazdButton) createWyjazdButton.onclick = async () => {
	try {
		var response = await API("wyjazd/create")
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/wyjazdy/${response.wyjazdID}`
}