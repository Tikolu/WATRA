function closeDialog() {
	const dialog = window.frameElement.parentElement
	dialog.close()
	return true
}

function resizeContainer() {
	window.frameElement.style.height = `${document.body.scrollHeight}px`;
}

window.onresize = () => resizeContainer()
resizeContainer()