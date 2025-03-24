if(this.deleteJednostkaButton) deleteJednostkaButton.onclick = async () => {
	if(!confirm(`Usunąć jednostkę ${jednostkaTitle.innerText}?`)) return
	try {
		await API(`jednostka/${META.jednostkaID}/delete`)
	} catch(error) {
		alert(error)
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
		alert(error)
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
		alert(error)
		return
	}
	document.location.href = `/jednostki/${response.subJednostkaID}`
}

if(this.createUserButton) createUserButton.onclick = async () => {
	try {
		var response = await API(`jednostka/${META.jednostkaID}/member/create`)
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/users/${response.userID}`
}

if(this.mianowanieButton) mianowanieButton.onclick = async () => {
	const userID = mianowanieUserSelect.value
	if(!userID) {
		alert("Nie wybrano użytkownika")
		return
	}
	let funkcjaType = mianowanieFunkcjaSelect.value
	if(!funkcjaType) {
		alert("Nie wybrano funkcji")
		return
	}
	funkcjaType = Number(funkcjaType)
	try {
		var response = await API(`jednostka/${META.jednostkaID}/member/${userID}/mianujNaFunkcję`, {
			funkcjaType
		})
	} catch(error) {
		alert(error)
		return
	}
	document.location.reload()
}