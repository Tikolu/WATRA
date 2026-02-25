API.registerHandler("event/[eventID]/member/[memberID]/setParticipation", {
	form: main,
	progressText: "Zapisywanie...",
	successText: "Zapisano",
	validate: data => {
		if(!data.participation) {
			Popup.error("Wybierz opcję")
			return false
		}
		data.participation = data.participation == "yes"
		return true
	},
	after: response => {
		if(!response.requiredFormResponses?.length) return
		const formResponse = response.requiredFormResponses[0]
		window.top.createURLDialog(`/forms/${formResponse.form}/responses/${formResponse.draft || "new"}`, true)
	}
})

main.onchange = () => {
	signature.reset()

	const participating = participationChoiceYes.checked
	
	participationText.classList.toggle("disabled", !participating)
	signature.classList.toggle("disabled", !participating)
	signature.required = participating	
}
if(window.signature) main.onchange()