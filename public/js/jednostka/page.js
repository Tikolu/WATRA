API.registerHandler("jednostka/[jednostkaID]/delete", {
	progressText: "Kasowanie jednostki...",
	before: () => deleteJednostkaDialog.result(),
	after: () => history.back()
})

API.registerHandler("jednostka/[jednostkaID]/update/name", {
	valueKey: "name",
	successText: "Zapisano nazwę"
})

API.registerHandler("jednostka/[jednostkaID]/member/create", {
	progressText: "Tworzenie użytkownika...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/users/${response.userID}`
	}
})

API.registerHandler("jednostka/[jednostkaID]/subJednostka/create", {
	progressText: "Tworzenie jednostki...",
	after: response => {
		window.refreshDataOnShow = true
		document.location.href = `/jednostki/${response.subJednostkaID}`
	}
})

API.registerHandler("jednostka/[jednostkaID]/member/[memberID]/mianujNaFunkcję", {
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
			api: `jednostka/[jednostkaID]/member/[memberID]/remove`,
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