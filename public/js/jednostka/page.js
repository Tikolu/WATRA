deleteJednostkaButton.onclick = async () => {
	if(!confirm(`Usunąć jednostkę ${jednostkaTitle.innerText}?`)) return
	try {
		await API(`jednostka/${META.jednostkaID}/delete`)
	} catch(error) {
		alert(error)
		return
	}
	history.back()
}

jednostkaNameInput.onblur = async () => {
	jednostkaNameInput.disabled = true
	try {
		var response = await API(`jednostka/${META.jednostkaID}/update/name`, {
			name: jednostkaNameInput.value
		})
	} catch(error) {
		alert(error)
		return
	} finally {
		jednostkaNameInput.disabled = false
	}
	jednostkaTitle.innerText = response.displayName
	jednostkaNameInput.innerText = response.name
}