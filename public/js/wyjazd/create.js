API.registerHandler("wyjazd/create", {
	progressText: "Tworzenie wyjazdu...",
	after: response => {
		window.top.location.href = `/wyjazdy/${response.wyjazdID}`
	}
})

wyjazdStartDate.onchange = () => {
	if(!wyjazdEndDate || wyjazdEndDate.value < wyjazdStartDate.value) {
		wyjazdEndDate.value = wyjazdStartDate.value
	}
}