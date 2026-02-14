for(const unitPicker of document.querySelectorAll(".unit-picker")) {
	const chooseAll = document.getElementById(`${unitPicker.id}-choose-all`)
	chooseAll?.globalCheckbox(unitPicker)

	// Open all groups of selected units
	const selected = unitPicker.querySelectorAll("input[type=checkbox]:checked")
	for(const checkbox of selected) {
		for(const group of checkbox.parentElementChain) {
			if(group.tagName === "DETAILS") group.open = true
		}
	}

	// Update checkbox when group opens or closes
	for(const group of unitPicker.querySelectorAll("details")) {
		group.ontoggle = () => {
			chooseAll?.calculateState()
		}
	}
}