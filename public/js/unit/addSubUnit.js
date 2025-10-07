API.registerHandler("unit/[unitID]/subUnit/create", {
	form: "create-unit",
	progressText: "Tworzenie units...",
	after: response => {
		unitNameInput.value = ""
		window.top.refreshDataOnShow = true
		window.top.location.href = `/units/${response.subUnitID}`
	}
})

API.registerHandler("unit/[unitID]/subUnit/link", {
	form: "link-unit",
	progressText: "Tworzenie units...",
	successText: "Dodano jednostkę",
	before: data => {
		if(!data.subUnitID) {
			throw "Nie wybrano units"
		}
		return true
	}
})