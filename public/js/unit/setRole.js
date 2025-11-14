API.registerHandler("unit/[unitID]/member/[memberID]/setRole", {
	form: main,
	progressText: "Mianowanie na funkcję...",
	successText: "Zapisano",
	validate: data => {		
		console.log(data)
		
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

		return true
	}
})

userSelect.onchange = () => {
	const org = userSelect.querySelector("input:checked")?.dataset.org
	for(const input of roleSelect.querySelectorAll("input")) {
		let nameVariants = input.dataset.nameVariants
		if(!nameVariants) continue
		nameVariants = JSON.parse(nameVariants)
		input.labels[0].textContent = nameVariants[org] || nameVariants["default"]
	}
}