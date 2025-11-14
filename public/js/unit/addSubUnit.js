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

unitOrgSelect.onchange = () => {
	for(const option of main.querySelectorAll("option")) {
		let nameVariants = option.dataset.nameVariants
		if(!nameVariants) continue
		nameVariants = JSON.parse(nameVariants)
		option.textContent = nameVariants[unitOrgSelect.value] || nameVariants.default || "(brak)"
	}
}

unitDepartmentSelect.onchange = () => {
	unitTypeSelect.value = ""
	for(const option of unitTypeSelect.options) {
		option.hidden = unitDepartmentSelect.value != option.dataset.department
		if(!option.hidden && !unitTypeSelect.value) {
			unitTypeSelect.value = option.value
		}
	}
}
unitDepartmentSelect.onchange()