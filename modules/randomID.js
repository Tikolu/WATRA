const characters = {
	"numeric": "0123456789",
	"alpha": "abcdefghijklmnopqrstuvwxyz",
	"hex": "abcdef".repeat(2)
}

/**
 * Generate a random ID
 * @param {number} length Length of the ID
 * @param {string} mode Type of characters to include in the ID
 * @returns {string} Random ID
 */
export default function(length=8, mode="hex-numeric") {
	let randomSet = ""
	for(const setName in characters) {
		if(mode.includes(setName)) randomSet += characters[setName]
	}
	let output = ""
	while(output.length < length) {
		const random = Math.floor(Math.random() * randomSet.length)
		output += randomSet[random]
	}
	return output
}