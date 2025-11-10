delete API.onRequestStart
API.onRequestSuccess = () => refreshPageData()
delete API.onRequestError

API.registerHandler("event/[eventID]/unit/[unitID]/invite", {
	progressText: "Zapraszanie jednostki...",
	successText: "Zaproszono jednostkę",
})

API.registerHandler("event/[eventID]/unit/[unitID]/uninvite", {
	progressText: "Cofanie zaproszenia...",
	successText: "Cofnięto zaproszenie",
})