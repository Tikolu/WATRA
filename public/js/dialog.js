function closeDialog(full) {
	frameElement.parentElement.close()
	if(full) {
		sleep(250).then(() => frameElement.parentElement.remove())
	}
	return true
}

async function resizeContainer() {
	const maxHeight = window.top.getComputedStyle(frameElement).maxHeight
	document.body.style.maxHeight = maxHeight

	frameElement.style.height = `${document.documentElement.scrollHeight}px`;
}

window.onresize = () => resizeContainer()
resizeContainer()

frameElement.classList.add("loaded")