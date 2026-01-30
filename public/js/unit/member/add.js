API.registerHandler("unit/[unitID]/member/add", {
	form: main,
	validate: data => {
		data.users = Array.create(data.userID)
		return true
	},
	progressText: "Dodawanie...",
	successText: "Dodano"
})