/**
 * Capitalises the first letter of a string
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
 * Returns true if every character is a letter, "-" or " "
 * @param {string} text
 * @returns {boolean} True if the text is a valid name
 */
export function validName(text) {
	if(!text || typeof text != "string") return false
	for(const letter of text) {
		if(letter == " " || letter == "-") continue
		if(letter.toUpperCase() == letter.toLowerCase()) return false
	}
	return true
}