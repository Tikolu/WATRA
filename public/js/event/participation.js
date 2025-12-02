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
	}
})

main.onchange = () => {
	signature.classList.remove("disabled")
	signature.reset()
}
if(window.signature) signature.classList.add("disabled")