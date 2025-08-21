const frame = window.frameElement

function closeDialog(full) {
	frame.parentElement.close()
	if(full) {
		sleep(250).then(() => frame.parentElement.remove())
	}
	return true
}

async function resizeContainer() {
	const maxHeight = window.top.getComputedStyle(frame).maxHeight
	document.body.style.maxHeight = maxHeight

	frame.style.height = `${document.documentElement.scrollHeight}px`;
}

window.onresize = () => resizeContainer()
resizeContainer()

frame.classList.add("loaded")