API.registerHandler("event/[eventID]/chooseApprovers", {
	form: "approver-list",
	progressText: "Ustawianie zatwierdzających...",
	successText: "Ustawiono zatwierdzających",
	validate: data => {
		data.approvers = Array.create(data.approvers)
		return true
	}
})