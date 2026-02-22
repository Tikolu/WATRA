function cleanString(str) {
	// Trim and lowercase
	str = str.trim().toLowerCase()
	// Remove accents
	str = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replaceAll("ł", "l")
	
	return str
}

for(const userPicker of document.querySelectorAll(".user-picker")) {
	const userPickerSearch = document.getElementById(`${userPicker.id}-search`)
	const chooseAll = document.getElementById(`${userPicker.id}-choose-all`)
	chooseAll?.globalCheckbox(userPicker)
	
	userPickerSearch.oninput = () => {
		const searchTerms = cleanString(userPickerSearch.value).split(" ")
		let resultCount = 0
		// Hide users not matching search term
		for(const entry of userPicker.querySelectorAll(".entry-grid > div")) {
			const entryValue = cleanString(entry.textContent)
			entry.hidden = searchTerms.some(term => !entryValue.includes(term))
			if(!entry.hidden) resultCount++
		}

		for(const group of userPicker.querySelectorAll("details")) {
			// Open groups with results, if search term is longer than 2 characters
			group.open = false
			if(group.querySelector(".entry-grid > div:not([hidden])")) {
				group.hidden = false
				if(userPickerSearch.value.length > 2) group.open = true
			// Hide groups without results, open all other groups
			} else {
				group.hidden = true
			}
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

	// User count and limit
	const userCount = document.querySelector(`#${userPicker.id}-count span`)
	if(userCount) {
		const limit = Number(userPicker.dataset.limit)
		const options = [...userPicker.querySelectorAll("input:not(:disabled)")]
		
		userPicker.addEventListener("change", () => {
			userPicker.count = options.filter(option => option.checked).unique("value").length
			userCount.innerText = userPicker.count

			if(userPicker.count >= limit) {
				for(const option of options) {
					if(option.checked) continue

					option.disabled = true
					option.classList.add("temp-disabled")
				}
			} else {
				for(const option of options) {
					if(!option.classList.contains("temp-disabled")) continue
					
					option.disabled = false
					option.classList.remove("temp-disabled")
				}
			}
		})
	}
}