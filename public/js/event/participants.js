async function updateFilters() {
	let url = `?unit=${unitFilter.value}&state=${stateFilter.value}`
	history.replaceState(null, "", url)

	const progressMessage = Popup.create({
		message: "Ładowanie danych...",
		type: "progress",
		icon: "progress_activity",
	})
	
	await refreshPageData()

	progressMessage.close()
}

unitFilter.addEventListener("change", updateFilters)
stateFilter.addEventListener("change", updateFilters)