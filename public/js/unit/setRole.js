API.registerHandler("unit/[unitID]/member/[memberID]/setRole", {
	form: main,
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {		
		if(!data.memberID) {
			throw new Error("Nie wybrano użytkownika")
		}
		if(!data.roleType) {
			throw new Error("Nie wybrano funkcji")
		}
		if(data.roleType == "remove") return {
			api: `unit/[unitID]/member/[memberID]/remove`,
			progressText: "Usuwanie użytkownika...",
			successText: "Usunięto"
		}

		data.roleType = Number(data.roleType)
		return true
	}
})

