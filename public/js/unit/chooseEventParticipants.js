API.registerHandler("unit/[unitID]/event/[eventID]/setParticipants", {
	form: main,
	progressText: "Ustawianie uczestników...",
	successText: "Ustawiono uczestników akcji",
	validate: data => {
		data.participants = Array.create(data.userID)
		return true
	}
})