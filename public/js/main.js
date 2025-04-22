// Service worker for streaming updates
let streamingWorker, streamingWorkerLastHeartbeat = 0
async function checkStreamingWorkerHeartbeat() {
	// Check if last heartbeat was over 2 seconds ago
	if(Date.now() - streamingWorkerLastHeartbeat < 2000) return
	debug("Streaming worker not responding")
	// If worker exists, unregister it
	await streamingWorker?.unregister()
	// Register new worker
	streamingWorker = await navigator.serviceWorker.register("/js/worker/streaming.js")
	debug("Registered Streaming worker")
}
setInterval(checkStreamingWorkerHeartbeat, 2000)

// Detect update events from worker
const streamingChannel = new BroadcastChannel("streaming")
streamingChannel.onmessage = message => {
	const {event, type, id} = message.data
	
	// Worker heartbeat event
	if(event == "heartbeat") {
		streamingWorkerLastHeartbeat = Date.now()
		
	// Worker error event
	} else if(event == "error") {
		throw `WorkerError: ${message.data.error}`

	// Data updated
	} else if(event == "update") {
		// Save in session storage
		Session.updates ||= {}
		Session.updates[type] ||= {}
		Session.updates[type][id] = Date.now()
		
		checkRefreshCondition(type, id)

	// Unknown event
	} else {
		throw new Error(`Unknown event: ${event}`)
	}
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

registerRefreshCondition(document.location)
for(const link of document.querySelectorAll("a[href]")) {
	registerRefreshCondition(link.href)
}

async function checkRefreshCondition(type, id) {
	for(const condition of pageRefreshConditions) {
		if(condition.type != type || condition.id != id) continue
		debug("Refreshing page...")
		document.location.reload()
		break
	}
}


// Page life-cycle events
window.initialLoadTime = Date.now()
window.onpageshow = event => {
	// Check if page restored from bfcache
	if(!event.persisted) return
	debug("Page restored from bfcache")

	// Restore history backup
	Session.history = [...historyBackup]

	// Check if any relevant updates occurred 
	const updates = Session.updates || {}
	for(const type in updates) {
		for(const id in updates[type]) {
			// Check if update occured after first page load
			if(updates[type][id] < window.initialLoadTime) continue
			checkRefreshCondition(type, id)
		}
	}
}
window.onbeforeunload = () => {
	// Close the streaming channel
	streamingChannel.close()
}


// Construct nav path
Session.history ||= []
{
	const nav = document.querySelector("nav")
	const homeLink = nav.querySelector("a:first-child")

	// Main page clears history
	if(document.location.pathname == "/") {
		Session.history = []
	}

	let pathHTML = ""
	for(const index in Session.history) {
		const entry = Session.history[index]

		// If encountered current page in history, remove it everything after it
		if(entry.path == document.location.pathname) {
			Session.history.splice(index)
			break
		}

		// Skip main page entry
		if(entry.path == "/") continue

		pathHTML += `
			<span class="icon">arrow_right</span>
			<a href="${entry.path}">${entry.title}</a>
		`
	}
	homeLink.insertAdjacentHTML("afterend", pathHTML)

	// Shrink nav to fit
	nav.overflows = () => nav.scrollWidth > nav.offsetWidth
	nav.calculateSizing = () => {
		if(!nav.overflows()) return
		// Start by removing last link
		nav.querySelector(":scope > a:last-child").remove()
		nav.querySelector(":scope > span.icon:last-child").remove()
		if(!nav.overflows()) return
	}
	nav.calculateSizing()
}


// Track visited pages
Session.history.push({
	path: document.location.pathname,
	title: document.title,
	visited: window.initialLoadTime,
})

// Store backup of history
const historyBackup = [...Session.history]


// Clicking user profile link clears history
userProfileLink.onclick = () => {
	Session.history = []
}