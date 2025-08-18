API.registerHandler("wyjazd/[wyjazdID]/member/[memberID]/mianujNaFunkcję", {
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {		
		if(!data.memberID) {
			throw new Error("Nie wybrano użytkownika")
		}
		if(!data.funkcjaType) {
			throw new Error("Nie wybrano funkcji")
		}
		
		data.funkcjaType = Number(data.funkcjaType)
		return true
	},
	before: () => closeDialog()
})

