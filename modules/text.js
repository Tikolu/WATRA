/**
 * Capitalises the first letter of a string
 * All other letters are set to lower case
 * @param {string} text
 * @returns {string} Capitalised text
 */
export function capitalise(text) {
	if(!text || typeof text != "string") return ""
	text = text.toLowerCase()
	text = text[0].toUpperCase() + text.substring(1)
	return text
}

/**
 * Formats a name. Capitalises the first letter of each word and removes any
 * characters that are not letters, hyphens, apostrophes or spaces
 * @param {string} name
 * @return {string} name
 */
export function formatName(name) {
	return name
		// Remove spaces from start and end
		.trim()
		// Replace fancy iOS apostrophes
		.replace(/’/g, "'")
		// Remove any characters that are not letters, hyphens, apostrophes or spaces
		.replace(/[^\p{L}'\- \s]/gu, '')
		// Capitalise the first letter of each word
		.replace(/(\p{Letter})(\p{Letter}*)/gu, (_, p1, p2) => p1.toUpperCase() + p2.toLowerCase())
		// Remove hyphens and apostrophes from start and end
		.replace(/^[\'\-]+|[\'\-]+$/g, '')
}

/**
 * Converts a string to a valid ID. Lowercases the text, replaces spaces with
 * hyphens and removes any characters that are not letters, numbers or hyphens
 * @param {string} text
 * @returns {string} ID
 */
export function id(text) {
	if(!text || typeof text != "string") return ""
	return text
		// Remove spaces from start and end
		.trim()
		// Lowercase
		.toLowerCase()
		// Replace spaces with hyphens
		.replace(/\s+/g, "-")
		// Remove any characters that are not letters, numbers or hyphens
		.replace(/[^\p{Lowercase_Letter}0-9\-]/gu, "")
}

/**
 * Formats a phone number
 * @param {string} phone
 * @returns {string} phone
 */
const phoneFormats = {
	"+353": [2, 3, 4],
	"default": [3, 3, 3]
}
export function formatPhone(phone, dropPrefix) {
	if(!phone) return ""
	
	let format
	for(const prefix in phoneFormats) {
		if(phone.startsWith(prefix)) {
			format = phoneFormats[prefix]
			break
		}
	}
	if(!format) format = phoneFormats["default"]

	let output = phone.slice(0, -9)
	let length = output.length
	for(const partLength of format) {
		output += ` ${phone.slice(length, length + partLength)}`
		length += partLength
	}

	if(dropPrefix) {
		let dropped = output.replace(/^\+\d+ /, "")
		if(output.startsWith("+353")) dropped = "0" + dropped
		return dropped
	}
	
	return output
}