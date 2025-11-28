API.registerHandler("event/[eventID]/file/add", {
	form: main,
	progressText: "Dodawanie dokumentu...",
	successText: "Dodano dokument"
})

main.onchange = () => {
	if(roleAccess.checked) {
		participantAccess.disabled = false
	} else {
		participantAccess.disabled = true
		participantAccess.checked = false
	}
}