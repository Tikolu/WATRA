API.registerHandler("unit/[unitID]/wyjazd/[wyjazdID]/setParticipants", {
	form: "member-list",
	progressText: "Ustawianie uczestników...",
	successText: "Ustawiono uczestników wyjazdu",
	validate: data => {
		data.participants = Array.create(data.participants)
		return true
	}
})

chooseAll.globalCheckbox(memberList)