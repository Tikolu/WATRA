API.registerHandler("event/[eventID]/member/[memberID]/setRole", {
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
		
		data.roleType = Number(data.roleType)
		return true
	}
})

