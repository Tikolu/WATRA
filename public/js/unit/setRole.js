API.registerHandler("unit/[unitID]/member/setRole", {
	form: main,
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {		
		data.users = Array.create(data.userID)
		if(!data.users.length) {
			throw new Error("Nie wybrano użytkowników")
		}
		if(!data.roleType) {
			throw new Error("Nie wybrano funkcji")
		}
		if(data.roleType == "remove") return {
			api: `unit/[unitID]/member/remove`,
			progressText: "Usuwanie...",
			successText: "Usunięto"
		}

		return true
	}
})

main.onchange = () => {
	const org = main.querySelector(".user-picker input:checked")?.dataset.org
	for(const option of roleSelect.options) {
		let nameVariants = option.dataset.nameVariants
		if(!nameVariants) continue
		nameVariants = JSON.parse(nameVariants)
		option.textContent = nameVariants[org] || nameVariants["default"]
	}
}