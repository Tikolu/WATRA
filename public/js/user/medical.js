API.registerHandler("user/[userID]/medical/update", {
	successText: "Zapisano opis"
})

API.registerHandler("user/[userID]/medical/add", {
	progressText: "Dodawanie..."
})

API.registerHandler("user/[userID]/medical/remove", {
	form: false,
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