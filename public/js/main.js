// Connect to stream API to detect updates
const eventSource = new EventSource("/api/stream")

// Listen for update events
eventSource.addEventListener("update", event => {
	if(!event.data) return
	const {type, id} = JSON.parse(event.data)
	trackDataUpdate(type, id)
	checkRefreshCondition(type, id)
})

// Listen for error events
eventSource.addEventListener("error", event => {
	if(!event.data) return
	// Attempt parsing JSON, otherwise report plain text
	let error
	try {
		error = JSON.parse(event.data)
	} catch {
		error = event.data
	}

	// Shut down event source
	eventSource.close()

	if(error.code == 403) {
		// Redirect to login page
		window.top.channel?.postMessage({
			event: "navigate",
			path: "/login"
		})
		window.top.location.href = "/login"

	} else {
		throw error.message || error
	}
})

// Refresh conditions system
const pageRefreshConditions = []
function registerRefreshCondition(path) {
	const url = new URL(path)
	const segments = url.pathname.substring("1").split("/")
	if(segments.length != 2) return
	if(!segments[0].match(/^\w+$/)) return
	if(!segments[1].match(/^[0-9a-f]+$/)) return

	const [type, id] = segments
	if(pageRefreshConditions.some(c => c.type == type && c.id == id)) return
	pageRefreshConditions.push({type, id})
}

// Register a refresh condition for URL and all link elements
registerRefreshCondition(document.location)
function scanForRefreshConditions() {
	for(const link of document.querySelectorAll("a[href]")) {
		registerRefreshCondition(link.href)
	}
}
scanForRefreshConditions()
window.afterDataRefresh.push(scanForRefreshConditions)

// Check if update should trigger a data refresh
async function checkRefreshCondition(type, id) {
	for(const condition of pageRefreshConditions) {
		if(condition.type != type || condition.id != id) continue
		await refreshPageData()
		window.updatedTime = Date.now()
		break
	}
}

// Check if any updates have occured since the page was first loaded
function checkDataUpdates() {
	const updates = Session.updates || {}
	for(const type in updates) {
		for(const id in updates[type]) {
			// Check if update occured after first page load
			if(updates[type][id] < window.updatedTime) continue
			checkRefreshCondition(type, id)
		}
	}
}

// Page life-cycle events
window.initialLoadTime = Date.now()
window.updatedTime = Date.now()
window.addEventListener("pageshow", event => {
	// Check if page restored from bfcache
	if(!event.persisted) {
		window.pageShowCount = 0
		return
	}
	window.pageShowCount += 1
	debug("Page restored from bfcache")

	// Restore history backup
	Session.history = [...window.historyBackup || []]

	// Blur focused and hovered element
	document.activeElement.blur()

	// Trigger refresh
	if(window.refreshDataOnShow) refreshPageData()
	window.refreshDataOnShow = false

	// Check if any relevant updates occurred 
	checkDataUpdates()
})

document.onvisibilitychange = event => {
	if(document.visibilityState == "hidden") return
	if(window.unloading) return
	checkDataUpdates()
}


// Construct nav path
Session.history ||= []
function constructNavPath() {
	const nav = document.querySelector("nav")
	const homeLink = nav.querySelector("a:first-child")

	const pathname = document.location.pathname.replace(/\/$/, "")

	// Main page clears history
	if(!pathname) {
		Session.history = []
	}

	const existingLinks = [...nav.querySelectorAll("a[href]")].map(a => a.href)

	const path = document.createDocumentFragment()
	for(const index in Session.history) {
		const entry = Session.history[index]

		// If encountered current page in history, remove it everything after it
		if(entry.path == pathname) {
			if(!window.pageShowCount) Session.history.splice(index)
			break
		}

		// Skip main page entry
		if(entry.path == "/") continue

		// Skip if link already exists
		if(existingLinks.some(link => link.endsWith(entry.path))) continue

		// Add arrow icon
		const icon = document.createElement("i")
		icon.innerText = "arrow_right"

		// Add link
		const link = document.createElement("a")
		link.href = entry.path
		link.innerText = entry.title

		path.append(icon, link)
	}
	homeLink.after(path)
}
constructNavPath()
// Scroll to end of nav
document.querySelector("nav a:last-child").scrollIntoViewIfNeeded?.()
window.afterDataRefresh.push(constructNavPath)

// Custom refreshing
window.addEventListener("keydown", event => {
	if(event.key == "F5") {
		if(event.ctrlKey || event.metaKey) return
	} else if(event.key == "r") {
		if(!event.ctrlKey && !event.metaKey) return
	} else return

	event.preventDefault()
	document.body.classList.add("refresh")
	refreshPageData()
})

if(!META.error) {
	// Track visited pages
	Session.history.push({
		path: document.location.pathname,
		title: document.title,
		visited: window.initialLoadTime,
	})

	// Store backup of history
	window.historyBackup = [...Session.history]
}

// Clicking user profile link clears history
// userProfileLink.onclick = () => {
// 	Session.history = []
// }