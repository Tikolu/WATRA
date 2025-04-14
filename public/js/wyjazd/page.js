if(this.deleteWyjazdButton) deleteWyjazdButton.onclick = async () => {
	if(!await deleteWyjazdDialog.result(`Usunąć wyjazd ${wyjazdTitle.innerText}?`)) return
	const progressMessage = Popup.info("Usuwanie wyjazdu...")
	try {
		await API(`wyjazd/${META.wyjazdID}/delete`)
	} catch(error) {
		progressMessage.close()
		Popup.error(error)
		return
	}
	history.back()
}

if(this.wyjazdNameInput) wyjazdNameInput.onsubmit = async () => {
	wyjazdNameInput.disabled = true
	wyjazdNameInput.classList.remove("invalid")
	try {
		var response = await API(`wyjazd/${META.wyjazdID}/update/name`, {
			name: wyjazdNameInput.value
		})
	} catch(error) {
		wyjazdNameInput.classList.add("invalid")
		Popup.error(error)
		return
	} finally {
		wyjazdNameInput.disabled = false
	}
	wyjazdTitle.innerText = response.displayName
	wyjazdNameInput.innerText = response.name
	Popup.success("Zapisano nazwę")
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
		Popup.error(error)
		return
	}
	wyjazdType.innerText = response.type
	wyjazdStartDateInput.value = response.startDate || ""
	wyjazdEndDateInput.value = response.endDate || ""
	wyjazdTitle.innerText = response.displayName
	return true
}

wyjazdStartDateInput.onsubmit = async () => {
	wyjazdStartDateInput.disabled = true
	wyjazdStartDateInput.classList.remove("invalid")
	if(await updateDates()) Popup.success("Zapisano datę rozpoczęcia")
	else wyjazdStartDateInput.classList.add("invalid")
	wyjazdStartDateInput.disabled = false
}

wyjazdEndDateInput.onsubmit = async () => {
	wyjazdEndDateInput.disabled = true
	wyjazdEndDateInput.classList.remove("invalid")
	if(await updateDates()) Popup.success("Zapisano datę rozpoczęcia")
	else wyjazdEndDateInput.classList.add("invalid")
	wyjazdEndDateInput.disabled = false
}

if(this.mianowanieButton) mianowanieButton.onclick = async () => {
	const userID = mianowanieUserSelect.value
	mianowanieUserSelect.classList.remove("invalid")
	if(!userID) {
		mianowanieUserSelect.classList.add("invalid")
		Popup.error("Nie wybrano użytkownika")
		return
	}
	let funkcjaType = mianowanieFunkcjaSelect.value
	mianowanieFunkcjaSelect.classList.remove("invalid")
	if(!funkcjaType) {
		mianowanieFunkcjaSelect.classList.add("invalid")
		Popup.error("Nie wybrano funkcji")
		return
	} else if(funkcjaType == "remove") {
		try {
			var response = await API(`wyjazd/${META.wyjazdID}/member/${userID}/remove`)
		} catch(error) {
			Popup.error(error)
			return
		}
	} else {
		funkcjaType = Number(funkcjaType)
		try {
			var response = await API(`wyjazd/${META.wyjazdID}/member/${userID}/mianujNaFunkcję`, {
				funkcjaType
			})
		} catch(error) {
			Popup.error(error)
			return
		}
	}
	document.location.reload()
}