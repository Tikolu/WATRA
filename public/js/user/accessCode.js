const currentLoginTime = window.top?.META.lastLogin

function callback() {
	const newLoginTime = window.top?.META.lastLogin
	if(currentLoginTime == newLoginTime) return

	// Remove callback
	window.top.afterDataRefresh = window.top.afterDataRefresh.filter(c => c != callback)
	// Close dialog
	dialog.fullClose()
}

window.top.afterDataRefresh.push(callback)