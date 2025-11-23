for(const userPicker of document.querySelectorAll(".user-picker")) {
	const userPickerSearch = document.getElementById(`${userPicker.id}-search`)
	const chooseAll = document.getElementById(`${userPicker.id}-choose-all`)
	chooseAll?.globalCheckbox(userPicker)

	userPickerSearch.oninput = () => {
		const searchTerms = userPickerSearch.value.trim().toLowerCase().split(" ")
		let resultCount = 0
		// Hide users not matching search term
		for(const entry of userPicker.querySelectorAll(".entry-grid > div")) {
			const entryValue = entry.textContent.toLowerCase()
			entry.hidden = searchTerms.some(term => !entryValue.includes(term))
			if(!entry.hidden) resultCount++
		}

		// Show or hide group titles
		for(const group of userPicker.querySelectorAll("details")) {
			const groupEntries = [...group.querySelectorAll(".entry-grid > div")]
			group.hidden = groupEntries.every(entry => entry.hidden)
		}

		// Show error message if no results
		userPicker.querySelector(".user-picker-error").hidden = resultCount > 0

		// Update checkbox
		chooseAll?.calculateState()
	}
	userPickerSearch.oninput()

	// Update checkbox when group opens or closes
	for(const group of userPicker.querySelectorAll("details")) {
		group.ontoggle = () => {
			chooseAll?.calculateState()
		}
	}
}