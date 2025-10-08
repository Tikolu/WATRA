API.registerHandler("unit/[unitID]/subUnit/[subUnitID]/remove", {
	form: "remove-unit",
	progressText: "Usuwanie z jednostki...",
	successText: "Usunięto z jednostki",
	validate: data => {
		data.subUnitID = META.unitID
		
		upperUnitChooser.classList.remove("invalid")
		if(!upperUnitChooser.value) {
			upperUnitChooser.classList.add("invalid")
			return
		}
		return true
	}
})

API.registerHandler("unit/[unitID]/delete", {
	progressText: "Trwale usuwanie jednostki...",
	after: () => {
		window.top.history.back()
	}
})