API.registerHandler("wyjazd/[wyjazdID]/chooseApprovers", {
	form: "approver-list",
	progressText: "Ustawianie zatwierdzających...",
	successText: "Ustawiono zatwierdzających",
	before: () => closeDialog(),
	validate: data => {
		data.approvers = Array.create(data.approvers)
		return true
	}
})