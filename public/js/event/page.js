API.registerHandler("event/[eventID]/delete", {
	progressText: "Kasowanie akcji...",
	before: () => deleteEventDialog.result(),
	after: () => history.back()
})

API.registerHandler("event/[eventID]/update/name", {
	successText: "Zapisano nazwę"
})

API.registerHandler("event/[eventID]/update/description", {
	successText: "Zapisano opis",
})

API.registerHandler("event/[eventID]/update/dates", {
	form: "event-dates",
	validate: data => new Date(`${data.startDate} ${data.startTime}`) <= new Date(`${data.endDate} ${data.endTime}`),
	successText: "Zapisano daty"
})

API.registerHandler("event/[eventID]/update/location", {
	successText: "Zapisano lokalizację",
})

API.registerHandler("unit/[unitID]/event/[eventID]/invitation/accept", {
	progressText: "Akceptowanie zaproszenia..."
})

API.registerHandler("unit/[unitID]/event/[eventID]/invitation/decline", {
	progressText: "Odrzucanie zaproszenia..."
})

API.registerHandler("event/[eventID]/unit/[unitID]/uninvite", {
	progressText: "Cofanie zaproszenia...",
	successText: "Cofnięto zaproszenie",
})

API.registerHandler("event/[eventID]/approval/unapprove", {
	progressText: "Cofanie zatwierdzenia...",
	successText: "Cofnięto zatwierdzenie"
})

API.registerHandler("event/[eventID]/file/[fileID]/delete", {
	progressText: "Usuwanie pliku...",
	successText: "Usunięto"
})

// Unlock editing
if(window.confirmUnlockEditingButton) {
	window.confirmUnlockEditingButton.onclick = () => {
		unlockEditingButton.remove()
	
		const disabledElements = [
			eventTitleInput,
			eventDescriptionInput,
			eventStartDateInput,
			eventStartTimeInput,
			eventEndDateInput,
			eventEndTimeInput,
			eventLocationInput,
			...eventDocuments.querySelectorAll("button[disabled]")
		]

		disabledElements.forEach(e => e.disabled = false)
	}
}