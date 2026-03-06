let sort

async function updateState() {
	userTable.classList.add("loading")
	
	const values = {}
	for(const filter of filterOptions.querySelectorAll("[name]")) {
		// Skip unchecked checkboxes
		if(filter.type == "checkbox" && !filter.checked) continue
		
		const key = filter.name
		// Convert duplicate values into array
		if(key in values) {
			if(!Array.isArray(values[key])) values[key] = [values[key]]
			if(!values[key][0] || !filter.value) values[key] = undefined
			else values[key].push(filter.value)

		} else values[key] = filter.value
	}

	const params = new URLSearchParams()
	for(const key in values) {
		let value = values[key]
		if(!value) continue
		if(Array.isArray(value)) value = value.join(",")
		params.set(key, value)
	}

	if(sort) params.set("sort", sort)

	const columns = []
	for(const columnOption of columnOptions.querySelectorAll("[name]")) {
		if(columnOption.checked) columns.push(columnOption.name)
	}
	params.set("columns", columns)
	
	history.replaceState(null, "", `?${decodeURIComponent(params.toString())}`)

	const progressMessage = Popup.create({
		message: "Ładowanie danych...",
		type: "progress",
		icon: "progress_activity",
	})
	
	await refreshPageData()

	progressMessage.close()
}

confirmFiltersButton.onclick = updateState
confirmColumnsButton.onclick = updateState

function initialiseTable() {
	userTable.classList.remove("loading")
	
	selectAllCheckbox.globalCheckbox(userTable)

	// Show actions when checkbox is checked
	userTable.onchange = event => {
		userActions.hidden = !selectAllCheckbox.checked && !selectAllCheckbox.indeterminate
		const checked = userTable.querySelectorAll("tbody :checked")
		userCount.innerText = checked.length
	}

	// Load sorting links
	for(const link of userTable.querySelectorAll("th a")) {
		link.onclick = async event => {
			event.preventDefault()
			sort = link.href.split("sort=")[1]	
			updateState()
		}
	}
}
initialiseTable()

window.afterDataRefresh.push(initialiseTable)

function toggleTableLinks(show) {
	for(const link of userTable.querySelectorAll(".details-link")) link.hidden = !show
}

exportButton.onclick = () => {
	toggleTableLinks(false)
	
	let csv = ""
	for(const row of userTable.querySelectorAll("tr")) {
		const cells = row.querySelectorAll("th, td")
		for(const [cellIndex, cell] of cells.entries()) {
			if(cell.querySelector("input[type=checkbox]")) continue
			csv += cell.innerText.replaceAll(",", "").replaceAll("\n", "; ").trim()
			if(cellIndex < cells.length - 1) csv += ","
		}
		csv += "\n"
	}

	toggleTableLinks(true)

	const blob = new Blob([csv], {type: "text/csv"})
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `${META.exportName}.csv`
	a.click()
	URL.revokeObjectURL(url)
}

printButton.onclick = async () => {
	window.print()
}


API.registerHandler("event/[eventID]/member/uninvite", {
	form: userTable,
	progressText: "Usuwanie użytkowników z akcji...",
	successText: "Usunięto użytkowników z akcji"
})


API.registerHandler("event/[eventID]/member/setParticipation", {
	validate: data => {
		data.participation = "pending"
		return true
	},
	form: userTable,
	progressText: "Cofanie zapisów...",
	successText: "Cofnięto zapis uczestników"
})