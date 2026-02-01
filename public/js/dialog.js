window.dialog = frameElement?.parentElement

if(!window.dialog) {
	history.back()
	throw new Error()
}

// After starting an API request, close the dialog
API.onRequestStart = async () => {
	dialog.close()
	await sleep(250)
	frameElement?.classList.remove("loaded")
}
// After a successful API request, reset the frame
API.onRequestSuccess = () => {
	dialog.fullClose()
}
// After a failed API request, re-open the dialog
API.onRequestError = () => {
	frameElement?.classList.add("loaded")
	if(dialog.open) return
	dialog.showModal()
}

dialog.fullClose = async () => {
	dialog.close()
	await sleep(250)
	if(!frameElement) return
	frameElement.style.height = null
	frameElement.src = ""
}

// Process buttons
function processDialogButtons() {
	const mainButtons = document.querySelectorAll("main button.confirm")
	const dialogButtons = document.querySelectorAll("body > .button-row:last-child > button")

	// Buttons without API attribute close dialog
	for(const button of dialogButtons) {
		if(button.hasAttribute("api")) continue
		button.addEventListener("click", () => {
			dialog.close()
		})
	}

	// Move button to dialog button row (if there is only one)
	if(!mainButtons.length || mainButtons.length > 1) return
	if(dialogButtons.length > 1) return
	document.querySelector("body > .button-row:last-child").appendChild(mainButtons[0])
}
processDialogButtons()

// Sizing calculations
async function resizeContainer() {
	const maxHeight = window.top.getComputedStyle(frameElement).maxHeight
	document.body.style.maxHeight = maxHeight

	frameElement.style.height = `${document.documentElement.scrollHeight}px`
}

window.onresize = () => resizeContainer()
resizeContainer()

frameElement.classList.add("loaded")