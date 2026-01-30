const currentLoginTime = window.top?.META.lastLogin

function callback() {
	const newLoginTime = window.top?.META.lastLogin
	if(currentLoginTime == newLoginTime) return

	// Remove callback
	if(window.top?.afterDataRefresh) {
		window.top.afterDataRefresh = window.top.afterDataRefresh.filter(c => c != callback)
	}
	// Close dialog
	dialog.fullClose()
}

const expiryTime = 1000 * 60 * 5
sleep(expiryTime).then(() => dialog.fullClose())

window.top.afterDataRefresh.push(callback)

accessCodeContainer.onclick = () => {
	copy(accessCode)
}