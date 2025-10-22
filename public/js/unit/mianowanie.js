API.registerHandler("unit/[unitID]/member/[memberID]/mianujNaFunkcję", {
	form: main,
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
			api: `unit/[unitID]/member/[memberID]/remove`,
			progressText: "Usuwanie użytkownika...",
			successText: "Usunięto"
		}

		data.funkcjaType = Number(data.funkcjaType)
		return true
	}
})

