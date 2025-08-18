API.registerHandler("jednostka/[jednostkaID]/member/[memberID]/mianujNaFunkcję", {
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {		
		if(!data.memberID) {
			throw new Error("Nie wybrano użytkownika")
		}
		if(!data.funkcjaType) {
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
	before: () => closeDialog()
})

