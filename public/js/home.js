if(this.createWyjazdButton) createWyjazdButton.onclick = async () => {
	try {
		var response = await API("wyjazd/create")
	} catch(error) {
		Popup.error(error)
		return
	}
	document.location.href = `/wyjazdy/${response.wyjazdID}`
}