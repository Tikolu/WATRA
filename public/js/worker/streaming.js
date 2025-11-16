// Create event source from streaming API
const eventSource = new EventSource("/api/stream")

const ports = []
onconnect = event => {
	const port = event.ports[0]
	ports.push(port)
}

// Sends message to all ports
function sendMessage(message) {
	for(const port of ports) {
		port.postMessage(message)
	}
}

// Listen for update events
eventSource.addEventListener("update", event => {
	if(!event.data) return
	const {type, id} = JSON.parse(event.data)

	// Send update event
	sendMessage({
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

	// Shut down event source
	eventSource.close()

	// Send error event
	sendMessage({
		event: "error",
		error: error.message || error
	})
})

// Worker error handler
this.onerror = error => {
	sendMessage({
		event: "error",
		error
	})
}