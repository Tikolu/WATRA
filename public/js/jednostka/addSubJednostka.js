API.registerHandler("jednostka/[jednostkaID]/subJednostka/create", {
	form: "create-jednostka",
	progressText: "Tworzenie jednostki...",
	before: () => closeDialog(),
	after: response => {
		jednostkaNameInput.value = ""
		window.top.refreshDataOnShow = true
		window.top.location.href = `/jednostki/${response.subJednostkaID}`
	}
})

API.registerHandler("jednostka/[jednostkaID]/subJednostka/link", {
	form: "link-jednostka",
	progressText: "Tworzenie jednostki...",
	successText: "Dodano jednostkę",
	before: () => closeDialog()
})