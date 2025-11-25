delete API.onRequestStart
delete API.onRequestSuccess

API.registerHandler("logout", {
	progressText: "Wylogowywanie...",
	refresh: "all"
})

themeChooser.value = Local.theme || "auto"
themeChooser.onchange = () => {
	// Save value
	Local.theme = themeChooser.value
	// Apply theme
	setTheme(themeChooser.value)
	top.setTheme(themeChooser.value)
}

feedbackButton.onclick = () => {
	const reportDialog = window.top.createURLDialog("/report/submit", true)

	dialog.fullClose()
}