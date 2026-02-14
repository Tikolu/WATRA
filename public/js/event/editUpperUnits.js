API.registerHandler("event/[eventID]/setUpperUnits", {
	form: main,
	validate: data => {		
		data.unitIDs = Array.create(data.unitIDs)
		if(!data.unitIDs.length) {
			throw new Error("Nie wybrano jednostek")
		}
		return true
	},
	progressText: "Ustawianie jednostek...",
	successText: "Zapisano jednostki nadrzędne"
})