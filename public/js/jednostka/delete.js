API.registerHandler("jednostka/[jednostkaID]/subJednostka/[subJednostkaID]/remove", {
	form: "remove-jednostka",
	progressText: "Usuwanie z jednostki...",
	successText: "Usunięto z jednostki",
	validate: data => {
		data.subJednostkaID = META.jednostkaID
		
		upperJednostkaChooser.classList.remove("invalid")
		if(!upperJednostkaChooser.value) {
			upperJednostkaChooser.classList.add("invalid")
			return
		}
		return true
	},
	before: () => closeDialog()
})

API.registerHandler("jednostka/[jednostkaID]/delete", {
	progressText: "Trwale usuwanie jednostki...",
	before: () => closeDialog(),
	after: () => {
		closeDialog(true)
		window.top.history.back()
	}
})