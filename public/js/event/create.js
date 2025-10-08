API.registerHandler("event/create", {
	progressText: "Tworzenie akcji...",
	after: response => {
		window.top.location.href = `/events/${response.eventID}`
	}
})

eventStartDate.onchange = () => {
	if(!eventEndDate || eventEndDate.value < eventStartDate.value) {
		eventEndDate.value = eventStartDate.value
	}
}