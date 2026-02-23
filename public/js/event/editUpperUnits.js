API.registerHandler("event/[eventID]/setUpperUnits", {
	form: main,
	validate: data => {		
		if(!data.unitIDs.length) {
			throw new Error("Nie wybrano jednostek")
		}
		return true
	},
	progressText: "Ustawianie jednostek...",
	successText: "Zapisano jednostki nadrzędne"
})