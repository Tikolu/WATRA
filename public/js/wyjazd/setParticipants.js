API.registerHandler("jednostka/[jednostkaID]/wyjazd/[wyjazdID]/setParticipants", {
	form: "member-list",
	progressText: "Ustawianie uczestników...",
	successText: "Ustawiono uczestników wyjazdu",
	before: () => closeDialog(),
	validate: data => {
		data.participants = Array.create(data.participants)
		return true
	}
})

chooseAll.globalCheckbox(memberList)