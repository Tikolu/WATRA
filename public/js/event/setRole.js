API.registerHandler("event/[eventID]/member/[userID]/setRole", {
	form: main,
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: data => {		
		if(!data.userID) {
			throw new Error("Nie wybrano użytkownika")
		}
		if(!data.roleType) {
			throw new Error("Nie wybrano funkcji")
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