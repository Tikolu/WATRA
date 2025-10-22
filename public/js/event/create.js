API.registerHandler("event/create", {
	form: "event-details",
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