API.registerHandler("wyjazd/create", {
	progressText: "Tworzenie wyjazdu...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/wyjazdy/${response.wyjazdID}`
	}
})