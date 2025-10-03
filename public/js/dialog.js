const dialog = frameElement.parentElement

// After starting an API request, close the dialog
API.onRequestStart = async () => {
	dialog.close()
	await sleep(250)
	frameElement.classList.remove("loaded")
}
// After a successful API request, reset the frame
API.onRequestSuccess = () => {
	dialog.close()
	sleep(250).then(() => {
		frameElement.style.height = null
		frameElement.src = ""
	})
}
// After a failed API request, re-open the dialog
API.onRequestError = () => {
	frameElement.classList.add("loaded")
	if(dialog.open) return
	dialog.showModal()
}

// Move button
function moveConfirmButton() {
	const mainButtons = document.querySelectorAll("main button.confirm")
	if(!mainButtons.length || mainButtons.length > 1) return
	const dialogButtons = document.querySelectorAll("body > .button-row:last-child > button")
	if(dialogButtons.length > 1) return
	document.querySelector("body > .button-row:last-child").appendChild(mainButtons[0])
}
moveConfirmButton()

// Sizing calculations
async function resizeContainer() {
	const maxHeight = window.top.getComputedStyle(frameElement).maxHeight
	document.body.style.maxHeight = maxHeight

	frameElement.style.height = `${document.documentElement.scrollHeight}px`;
}

window.onresize = () => resizeContainer()
resizeContainer()

frameElement.classList.add("loaded")