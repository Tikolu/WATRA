if(this.deleteJednostkaButton) deleteJednostkaButton.onclick = async () => {
	if(!await deleteJednostkaDialog.result()) return
	const progressMessage = Popup.info("Kasowanie jednostki...")
	return
	try {
		await API(`jednostka/${META.jednostkaID}/delete`)
	} catch(error) {
		progressMessage.close()
		Popup.error(error)
		return
	}
	history.back()
}

if(this.jednostkaNameInput) jednostkaNameInput.onsubmit = async () => {
	jednostkaNameInput.disabled = true
	jednostkaNameInput.classList.remove("invalid")
	try {
		var response = await API(`jednostka/${META.jednostkaID}/update/name`, {
			name: jednostkaNameInput.value
		})
	} catch(error) {
		jednostkaNameInput.classList.add("invalid")
		Popup.error(error)
		return
	} finally {
		jednostkaNameInput.disabled = false
	}
	jednostkaTitle.innerText = response.displayName
	jednostkaNameInput.innerText = response.name
	Popup.success("Zapisano nazwę")
}

if(this.createSubJednostkaButton) createSubJednostkaButton.onclick = async () => {
	const progressMessage = Popup.info("Tworzenie jednostki...")
	try {
		var response = await API(`jednostka/${META.jednostkaID}/subJednostka/create`, {upperJednostkaID: META.jednostkaID})
	} catch(error) {
		progressMessage.close()
		Popup.error(error)
		return
	}
	document.location.href = `/jednostki/${response.subJednostkaID}`
}

if(this.createUserButton) createUserButton.onclick = async () => {
	const progressMessage = Popup.info("Tworzenie użytkownika...")
	try {
		var response = await API(`jednostka/${META.jednostkaID}/member/create`)
	} catch(error) {
		progressMessage.close()
		Popup.error(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}

if(this.mianowanieButton) mianowanieButton.onclick = async () => {
	mianowanieUserSelect.classList.remove("invalid")
	mianowanieFunkcjaSelect.classList.remove("invalid")
	
	const userID = mianowanieUserSelect.value
	if(!userID) {
		mianowanieUserSelect.classList.add("invalid")
		Popup.error("Nie wybrano użytkownika")
		return
	}
	let funkcjaType = mianowanieFunkcjaSelect.value
	if(!funkcjaType) {
		mianowanieFunkcjaSelect.classList.add("invalid")
		Popup.error("Nie wybrano funkcji")
		return
	} else if(funkcjaType == "remove") {
		const progressMessage = Popup.info("Usuwanie użytkownika...")
		try {
			var response = await API(`jednostka/${META.jednostkaID}/member/${userID}/remove`)
		} catch(error) {
			progressMessage.close()
			Popup.error(error)
			return
		}
	} else {
		funkcjaType = Number(funkcjaType)
		const progressMessage = Popup.info("Mianowanie na funkcję...")
		try {
			var response = await API(`jednostka/${META.jednostkaID}/member/${userID}/mianujNaFunkcję`, {
				funkcjaType
			})
		} catch(error) {
			progressMessage.close()
			Popup.error(error)
			return
		}
	}
	document.location.reload()
}