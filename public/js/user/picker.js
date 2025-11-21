for(const userPickerSearch of document.querySelectorAll(".user-picker-search")) {
	const userPicker = userPickerSearch.nextElementSibling
	userPickerSearch.oninput = () => {
		const searchTerms = userPickerSearch.value.trim().toLowerCase().split(" ")
		let resultCount = 0
		// Hide users not matching search term
		for(const entry of userPicker.querySelectorAll(".entry-grid > div")) {
			const entryValue = entry.textContent.toLowerCase()
			entry.hidden = searchTerms.some(term => !entryValue.includes(term))
			if(entry.hidden) {
				const input = entry.querySelector("input")
				if(input) input.checked = false
			} else resultCount++
		}

		// Show/hide group titles
		for(const group of userPicker.querySelectorAll("details")) {
			const groupEntries = [...group.querySelectorAll(".entry-grid > div")]
			group.hidden = groupEntries.every(entry => entry.hidden)
		}

		// Show error message if no results
		userPicker.querySelector(".user-picker-error").hidden = resultCount > 0
	}
}