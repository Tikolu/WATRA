API.registerHandler("jednostka/[jednostkaID]/wyjazd/[wyjazdID]/setParticipants", {
	progressText: "Ustawianie uczestników...",
	successText: "Ustawiono uczestników wyjazdu",
	validate: data => {
		if(!Array.isArray(data.participants)) {
			data.participants = data.participants ? [data.participants] : []
		}
		return true
	}
})

chooseAll.globalCheckbox(memberList)