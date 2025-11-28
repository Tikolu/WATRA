const COUNT_LIMIT = 10

const IP_LIST = {}

export function exceeded(ip) {
	let {count, last} = IP_LIST[ip] || {}
	if(!count) return

	const timeSinceLast = Date.now() - last
	// Remove 1 count every 10 seconds
	count -= Math.floor(timeSinceLast / 10000)
	if(count < 0) count = 0

	// Save statistics
	if(count > 0) {
		IP_LIST[ip] = {count, last}
	} else {
		delete IP_LIST[ip]
	}

	// Block if exceeded limit
	return count > COUNT_LIMIT
}

export function recordRequest(ip) {
	let {count, last} = IP_LIST[ip] || {}
	count ||= 0

	// Register one count per request
	count += 1
	last = Date.now()
	
	// Save statistics
	IP_LIST[ip] = {count, last}
}