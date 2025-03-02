logoutButton.onclick = async () => {
	try {
		await API("logout")
	} catch(error) {
		alert(error)
	}
	document.location.reload()
}