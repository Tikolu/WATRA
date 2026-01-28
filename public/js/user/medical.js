API.registerHandler("user/[userID]/medical/update", {
	form: element => element.parentElement,
	successText: "Zapisano opis"
})

API.registerHandler("user/[userID]/medical/add", {
	progressText: "Dodawanie...",
	after: (response, data, element) => {
		// Clear dialog form
		const dialog = element.parentElement.parentElement
		if(!dialog.matches("dialog")) return
		for(const input of dialog.querySelectorAll("input, textarea")) {
			input.value = ""
		}
	}
})

API.registerHandler("user/[userID]/medical/remove", {
	progressText: "Usuwanie..."
})