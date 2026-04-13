const currentLoginTime = window.top?.META.lastLogin

window.top.processing?.register(function checkAccessCodeUsage() {
	const newLoginTime = window.top?.META.lastLogin
	if(currentLoginTime == newLoginTime) return

	// Remove callback
	window.top.processing?.removeFunction("checkAccessCodeUsage")

	// Close dialog
	dialog.fullClose()
})

const expiryTime = 1000 * 60 * 5
sleep(expiryTime).then(() => dialog.fullClose())

accessCodeContainer.onclick = () => {
	copy(accessCode)
}