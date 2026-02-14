for(const unitPicker of document.querySelectorAll(".unit-picker")) {
	// Open all groups of selected units
	const selected = unitPicker.querySelectorAll("input[type=checkbox]:checked")
	for(const checkbox of selected) {
		for(const group of checkbox.parentElementChain) {
			if(group.tagName === "DETAILS") group.open = true
		}
	}
}