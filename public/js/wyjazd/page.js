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
	successText: "Zapisano daty",
	after: response => {
		wyjazdTitle.innerText = response.displayName
		wyjazdType.innerText = response.type
	}
})

API.registerHandler("wyjazd/[wyjazdID]/member/[memberID]/mianujNaFunkcję", {
	progressText: "Mianowanie na funkcję...",
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
			progressText: "Usuwanie użytkownika..."
		}

		data.funkcjaType = Number(data.funkcjaType)
		return true
	},
	after: () => document.location.reload()
})