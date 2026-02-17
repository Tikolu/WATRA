delete API.onRequestStart
delete API.onRequestSuccess

function updateResponseID(response) {
	if(META.responseID == "new") {
		META.responseID = response.responseID
		history.replaceState(null, null, response.responseID)
	}
}

API.registerHandler("form/[formID]/response/[responseID]/element/[elementID]/update", {
	after: updateResponseID,
	successText: "Zapisano"
})

API.registerHandler("form/[formID]/response/[responseID]/setUser", {
	after: updateResponseID
})

API.registerHandler("form/[formID]/response/[responseID]/submit", {
	form: main,
	before: () => {
		dialog.close()
		return true
	},
	after: () => dialog.fullClose(),
	progressText: "Wysyłanie odpowiedzi...",
	successText: "Odpowiedź wysłana"
})

main.onchange = () => {
	window.signature?.classList.remove("disabled")
	window.signature?.reset()
}