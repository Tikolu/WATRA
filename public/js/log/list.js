async function updateFilters() {
	const startDate = new Date(filterStart.value)
	const endDate = new Date(filterEnd.value)
	
	filterStart.classList.remove("invalid")
	filterEnd.classList.remove("invalid")
	
	if(startDate >= endDate) {
		filterStart.classList.add("invalid")
		filterEnd.classList.add("invalid")
		return
	}
	
	let url = `?start=${filterStart.value}&end=${filterEnd.value}`
	url += `&direct=${directFilter.checked}`
	if(eventTypeFilter.value) url += `&type=${eventTypeFilter.value}`
	history.replaceState(null, "", url)

	const progressMessage = Popup.create({
		message: "Ładowanie danych...",
		type: "progress",
		icon: "progress_activity",
	})
	
	await refreshPageData()

	progressMessage.close()
}

filterStart.addEventListener("submit", updateFilters)
filterEnd.addEventListener("submit", updateFilters)
directFilter.addEventListener("change", updateFilters)
eventTypeFilter.addEventListener("change", updateFilters)