delete API.onRequestStart
API.onRequestSuccess = () => refreshPageData()

API.registerHandler("event/[eventID]/registration", {
	validate: data => {
		return {
			api: `event/${data.eventID}/registration/${data.value ? "enable" : "disable"}`,
			progressText: data.value ? "Włączanie zapisów" : "Wyłączanie zapisów",
			successText: data.value ? "Włączono zapisy" : "Wyłączono zapisy",
		}
	}
})

API.registerHandler("event/[eventID]/update/limits", {
	form: "event-limits",
	progressText: "Zapisywanie limitów...",
	successText: "Zapisano limity"
})