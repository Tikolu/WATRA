API.registerHandler("wyjazd/[wyjazdID]/delete", {
	progressText: "Kasowanie wyjazdu...",
	before: () => deleteWyjazdDialog.result(),
	after: () => history.back()
})

API.registerHandler("wyjazd/[wyjazdID]/update/name", {
	successText: "Zapisano nazwę",
	after: response => wyjazdTitle.innerText = response.displayName
})

API.registerHandler("wyjazd/[wyjazdID]/update/dates", {
	successText: "Zapisano daty"
})

API.registerHandler("wyjazd/[wyjazdID]/member/[memberID]/mianujNaFunkcję", {
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {
		mianowanieUserSelect.classList.remove("invalid")
		mianowanieFunkcjaSelect.classList.remove("invalid")
		
		if(!data.memberID) {
			mianowanieUserSelect.classList.add("invalid")
			throw new Error("Nie wybrano użytkownika")
		}
		if(!data.funkcjaType) {
			mianowanieFunkcjaSelect.classList.add("invalid")
			throw new Error("Nie wybrano funkcji")
		}
		if(data.funkcjaType == "remove") return {
			api: `wyjazd/[wyjazdID]/member/[memberID]/remove`,
			progressText: "Usuwanie użytkownika...",
			successText: "Usunięto"
		}

		data.funkcjaType = Number(data.funkcjaType)
		return true
	},
	after: () => {
		mianowanieUserSelect.value = ""
		mianowanieFunkcjaSelect.value = ""
	}
})

API.registerHandler("wyjazd/[wyjazdID]/member/[memberID]/setParticipation", {
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: data => {
		data.participation = data.participation == "yes"
		return true
	}
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