API.registerHandler("event/[eventID]/member/[memberID]/setParticipation", {
	form: "event-participation",
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: data => {
		data.participation = data.participation == "yes"
		return true
	}
})