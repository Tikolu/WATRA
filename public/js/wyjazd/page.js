if(this.deleteWyjazdButton) deleteWyjazdButton.onclick = async () => {
	if(!confirm(`Usunąć wyjazd ${wyjazdTitle.innerText}?`)) return
	try {
		await API(`wyjazd/${META.wyjazdID}/delete`)
	} catch(error) {
		alert(error)
		return
	}
	history.back()
}

if(this.wyjazdNameInput) wyjazdNameInput.onsubmit = async () => {
	wyjazdNameInput.disabled = true
	try {
		var response = await API(`wyjazd/${META.wyjazdID}/update/name`, {
			name: wyjazdNameInput.value
		})
	} catch(error) {
		alert(error)
		return
	} finally {
		wyjazdNameInput.disabled = false
	}
	wyjazdTitle.innerText = response.displayName
	wyjazdNameInput.innerText = response.name
}

async function updateDates() {
	const startDate = wyjazdStartDateInput.value
	const endDate = wyjazdEndDateInput.value
	try {
		var response = await API(`wyjazd/${META.wyjazdID}/update/dates`, {
			startDate,
			endDate
		})
	} catch(error) {
		alert(error)
		return
	}
	wyjazdType.innerText = response.type
	wyjazdStartDateInput.value = response.startDate || ""
	wyjazdEndDateInput.value = response.endDate || ""
	wyjazdTitle.innerText = response.displayName
}

wyjazdStartDateInput.onsubmit = async () => {
	wyjazdStartDateInput.disabled = true
	await updateDates()
	wyjazdStartDateInput.disabled = false
}

wyjazdEndDateInput.onsubmit = async () => {
	wyjazdEndDateInput.disabled = true
	await updateDates()
	wyjazdEndDateInput.disabled = false
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
	} else if(funkcjaType == "remove") {
		try {
			var response = await API(`wyjazd/${META.wyjazdID}/member/${userID}/remove`)
		} catch(error) {
			alert(error)
			return
		}
	} else {
		funkcjaType = Number(funkcjaType)
		try {
			var response = await API(`wyjazd/${META.wyjazdID}/member/${userID}/mianujNaFunkcję`, {
				funkcjaType
			})
		} catch(error) {
			alert(error)
			return
		}
	}
	document.location.reload()
}