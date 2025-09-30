const dialog = frameElement.parentElement

// After starting an API request, close the dialog
API.onRequestStart = async () => {
	dialog.close()
	await sleep(250)
	frameElement.classList.remove("loaded")
}
// After a successful API request, reset the frame
API.onRequestSuccess = async () => {
	dialog.close()
	await sleep(250)
	frameElement.style.height = null
	frameElement.src = ""
}
// After a failed API request, re-open the dialog
API.onRequestError = () => {
	frameElement.classList.add("loaded")
	if(dialog.open) return
	dialog.showModal()
}


async function resizeContainer() {
	const maxHeight = window.top.getComputedStyle(frameElement).maxHeight
	document.body.style.maxHeight = maxHeight

	frameElement.style.height = `${document.documentElement.scrollHeight}px`;
}

window.onresize = () => resizeContainer()
resizeContainer()

frameElement.classList.add("loaded")