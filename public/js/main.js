// Service worker for streaming updates
const streamingWorkerState = {
	instance: null,
	registering: false,
	lastHeartBeat: 0
}
async function checkStreamingWorkerHeartbeat() {
	// Check if last heartbeat was over 2 seconds ago
	if(Date.now() - streamingWorkerState.lastHeartBeat < 2000) return
	if(streamingWorkerState.registering) return
	streamingWorkerState.registering = true
	// If worker exists, unregister it
	await streamingWorkerState.instance?.unregister()
	// Register new worker
	streamingWorkerState.instance = await navigator.serviceWorker.register("/js/worker/streaming.js")
	debug("Registered new Streaming worker")
	await streamingWorkerState.instance?.ready
	await sleep(2500)
	streamingWorkerState.registering = false
}


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
window.onpageshow = event => {
	window.unloading = false
	// Start service worker heartbeat check
	streamingWorkerState.interval = setInterval(checkStreamingWorkerHeartbeat, 2000)

	// Detect update events from worker
	window.streamingChannel = new BroadcastChannel("streaming")
	window.streamingChannel.onmessage = message => {
		const {event, type, id} = message.data
		
		// Worker heartbeat event
		if(event == "heartbeat") {
			streamingWorkerState.lastHeartBeat = Date.now()
			
		// Worker error event
		} else if(event == "error") {
			throw `WorkerError: ${message.data.error}`

		// Data updated
		} else if(event == "update") {
			trackDataUpdate(type, id)
			checkRefreshCondition(type, id)

		// Unknown event
		} else {
			throw new Error(`Unknown event: ${event}`)
		}
	}
	
	
	// Check if page restored from bfcache
	if(!event.persisted) {
		window.pageShowCount = 0
		return
	}
	window.pageShowCount += 1
	debug("Page restored from bfcache")

	// Restore history backup
	Session.history = [...historyBackup]

	// Blur focused and hovered element
	document.activeElement.blur()

	// Trigger refresh
	if(window.refreshDataOnShow) refreshPageData()
	window.refreshDataOnShow = false

	// Check if any relevant updates occurred 
	checkDataUpdates()
}

window.onbeforeunload = () => {
	// Close the streaming channel
	console.log("Unloading...")
	window.streamingChannel.close()
	window.unloading = true
	// Stop service worker heartbeat check
	clearInterval(streamingWorkerState.interval)
}

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

	let pathHTML = ""
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

		pathHTML += `
			<i>arrow_right</i>
			<a href="${entry.path}">${entry.title}</a>
		`
	}
	homeLink.insertAdjacentHTML("afterend", pathHTML)
}
constructNavPath()
window.afterDataRefresh.push(constructNavPath)

if(!META.error) {
	// Track visited pages
	Session.history.push({
		path: document.location.pathname,
		title: document.title,
		visited: window.initialLoadTime,
	})

	// Store backup of history
	const historyBackup = [...Session.history]
}

// Clicking user profile link clears history
userProfileLink.onclick = () => {
	Session.history = []
}