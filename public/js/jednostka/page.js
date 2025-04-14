if(this.deleteJednostkaButton) deleteJednostkaButton.onclick = async () => {
	if(!await deleteJednostkaDialog.result()) return
	try {
		await API(`jednostka/${META.jednostkaID}/delete`)
	} catch(error) {
		Popup.error(error)
		return
	}
	history.back()
}

if(this.jednostkaNameInput) jednostkaNameInput.onsubmit = async () => {
	jednostkaNameInput.disabled = true
	try {
		var response = await API(`jednostka/${META.jednostkaID}/update/name`, {
			name: jednostkaNameInput.value
		})
	} catch(error) {
		Popup.error(error)
		return
	} finally {
		jednostkaNameInput.disabled = false
	}
	jednostkaTitle.innerText = response.displayName
	jednostkaNameInput.innerText = response.name
}

if(this.createSubJednostkaButton) createSubJednostkaButton.onclick = async () => {
	try {
		var response = await API(`jednostka/${META.jednostkaID}/subJednostka/create`, {upperJednostkaID: META.jednostkaID})
	} catch(error) {
		Popup.error(error)
		return
	}
	document.location.href = `/jednostki/${response.subJednostkaID}`
}

if(this.createUserButton) createUserButton.onclick = async () => {
	try {
		var response = await API(`jednostka/${META.jednostkaID}/member/create`)
	} catch(error) {
		Popup.error(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}

if(this.mianowanieButton) mianowanieButton.onclick = async () => {
	const userID = mianowanieUserSelect.value
	if(!userID) {
		Popup.error("Nie wybrano użytkownika")
		return
	}
	let funkcjaType = mianowanieFunkcjaSelect.value
	if(!funkcjaType) {
		Popup.error("Nie wybrano funkcji")
		return
	} else if(funkcjaType == "remove") {
		try {
			var response = await API(`jednostka/${META.jednostkaID}/member/${userID}/remove`)
		} catch(error) {
			Popup.error(error)
			return
		}
	} else {
		funkcjaType = Number(funkcjaType)
		try {
			var response = await API(`jednostka/${META.jednostkaID}/member/${userID}/mianujNaFunkcję`, {
				funkcjaType
			})
		} catch(error) {
			Popup.error(error)
			return
		}
	}
	document.location.reload()
}