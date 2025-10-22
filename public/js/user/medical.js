API.registerHandler("user/[userID]/medical/update", {
	form: element => element.parentElement,
	successText: "Zapisano opis"
})

API.registerHandler("user/[userID]/medical/add", {
	progressText: "Dodawanie..."
})

API.registerHandler("user/[userID]/medical/remove", {
	progressText: "Usuwanie..."
})

API.registerHandler("user/[userID]/medical/confirm", {
	progressText: "Zatwierdzanie...",
	successText: "Zatwierdzono"
})

API.registerHandler("user/[userID]/medical/unconfirm", {
	progressText: "Cofanie zatwierdzenia...",
	successText: "Cofnięto zatwierdzenie"
})