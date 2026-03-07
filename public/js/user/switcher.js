delete API.onRequestStart
delete API.onRequestSuccess

API.registerHandler("logout", {
	progressText: "Wylogowywanie...",
	refresh: false,
	after: () => {
		// Redirect to login page
		window.top.channel?.postMessage({
			event: "navigate",
			path: "/login"
		})
		window.top.location.href = "/login"
		// Close switcher dialog
		window.dialog?.fullClose()
	}
})

API.registerHandler("preferences/update/theme", {
	progressText: "Zmienianie motywu...",
	valueKey: "theme",
	refresh: "all"
})

feedbackButton.onclick = () => {
	const reportDialog = window.top.createURLDialog("/report/submit", true)

	dialog.fullClose()
}