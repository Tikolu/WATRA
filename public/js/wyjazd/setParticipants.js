API.registerHandler("jednostka/[jednostkaID]/wyjazd/[wyjazdID]/setParticipants", {
	form: "member-list",
	progressText: "Ustawianie uczestników...",
	successText: "Ustawiono uczestników wyjazdu",
	before: () => closeDialog(),
	validate: data => {
		if(!Array.isArray(data.participants)) {
			data.participants = data.participants ? [data.participants] : []
		}
		return true
	}
})

chooseAll.globalCheckbox(memberList)