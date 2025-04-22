// Create broadcast channel
const channel = new BroadcastChannel("streaming")

// Create event source
const eventSource = new EventSource("/api/stream")

// Listen for update events
eventSource.addEventListener("update", event => {
	if(!event.data) return
	const {type, id} = JSON.parse(event.data)

	// Send update event
	channel.postMessage({
		event: "update",
		type,
		id
	})
})

// Listen for error events
eventSource.addEventListener("error", event => {
	if(!event.data) return
	// Attempt parsing JSON, otherwise report plain text
	try {
		var error = JSON.parse(event.data)
	} catch {
		var error = event.data
	}
	channel.postMessage({
		event: "error",
		error: error.message || error
	})
})


// Send heartbeat every 500ms
setInterval(() => {
	if(eventSource.readyState == eventSource.CLOSED) return
	channel.postMessage({event: "heartbeat"})
}, 500)

// Worker error handler
this.onerror = error => {
	channel.postMessage({
		event: "error",
		error
	})
}