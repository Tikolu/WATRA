API.registerHandler("unit/[unitID]/subUnit/create", {
	form: "create-unit",
	progressText: "Tworzenie jednostki...",
	after: response => {
		unitNameInput.value = ""
		window.top.refreshDataOnShow = true
		window.top.location.href = `/units/${response.subUnitID}`
	}
})

API.registerHandler("unit/[unitID]/subUnit/link", {
	form: "link-unit",
	progressText: "Dodawanie jednostki...",
	successText: "Dodano jednostkę",
	before: data => {
		if(!data.subUnitID) {
			throw "Nie wybrano jednostki"
		}
		return true
	}
})