/**
 * sleep module
 * @module sleep module
 */

/**
 * Waits for a given amount of milliseconds
 * @param {number} ms Amount of milliseconds to sleep for
 * @returns Promise which resolves after the provided amount of milliseconds 
 */
export default function(ms) {
	return new Promise(resolve => {
		if(ms == Infinity) return
		setTimeout(resolve, ms)
	})
}