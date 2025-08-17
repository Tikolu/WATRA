API.registerHandler("wyjazd/[wyjazdID]/member/[memberID]/setParticipation", {
	form: "wyjazd-participation",
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: data => {
		data.participation = data.participation == "yes"
		return true
	}
})