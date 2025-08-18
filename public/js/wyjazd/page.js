API.registerHandler("wyjazd/[wyjazdID]/delete", {
	progressText: "Kasowanie wyjazdu...",
	before: () => deleteWyjazdDialog.result(),
	after: () => history.back()
})

API.registerHandler("wyjazd/[wyjazdID]/update/name", {
	successText: "Zapisano nazwę",
	after: response => wyjazdTitle.innerText = response.displayName
})

API.registerHandler("wyjazd/[wyjazdID]/update/description", {
	successText: "Zapisano opis",
})

API.registerHandler("wyjazd/[wyjazdID]/update/dates", {
	successText: "Zapisano daty"
})

API.registerHandler("wyjazd/[wyjazdID]/update/location", {
	successText: "Zapisano lokalizację",
})

API.registerHandler("jednostka/[jednostkaID]/wyjazd/[wyjazdID]/invitation/accept", {
	progressText: "Akceptowanie zaproszenia..."
})

API.registerHandler("jednostka/[jednostkaID]/wyjazd/[wyjazdID]/invitation/decline", {
	progressText: "Odrzucanie zaproszenia..."
})

API.registerHandler("wyjazd/[wyjazdID]/jednostka/[jednostkaID]/uninvite", {
	progressText: "Cofanie zaproszenia...",
	successText: "Cofnięto zaproszenie",
})

API.registerHandler("wyjazd/[wyjazdID]/approval/unapprove", {
	progressText: "Cofanie zatwierdzenia...",
	successText: "Cofnięto zatwierdzenie"
})