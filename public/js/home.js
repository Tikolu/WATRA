API.registerHandler("wyjazd/create", {
	progressText: "Tworzenie wyjazdu...",
	after: response => document.location.href = `/wyjazdy/${response.wyjazdID}`
})