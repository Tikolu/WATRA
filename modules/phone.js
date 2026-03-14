import Config from "modules/config.js"
const defaultPrefix = Config.phonePrefix


const phoneFormats = {
	"+1": "xxx xxx xxxx",
	"+353": "0xx xxx xxxx",
	"default": "xxx xxx xxx"
}
function findFormat(number) {
	for(const formatPrefix in phoneFormats) {
		if(!number.startsWith(formatPrefix)) continue
		return {
			prefix: formatPrefix,
			format: phoneFormats[formatPrefix]
		}
	}
	
	return {
		prefix: number.startsWith("+") ? number.slice(0, -9) : "",
		format: phoneFormats["default"]
	}
}


/**
 * Formats a phone number, optionally dropping the country code prefix
 * @param {string} phone
 * @param {boolean} includePrefix - Whether to include the country code prefix
 * @returns {string} phone
 */
export function format(input, includePrefix=true) {
	if(!input) return ""

	// Find format definition
	let {prefix, format} = findFormat(input)
	let number = input.slice(prefix.length)

	// Remove trunk prefix if including country code
	if(includePrefix) format = format.replace(/^0/, "")

	let output = ""
	for(const char of format) {
		if(char == "x") {
			if(number.length == 0) break
			output += number[0]
			number = number.slice(1)
		} else {
			output += char
		}
	}

	if(includePrefix && prefix) return `${prefix} ${output}`
	else return output
}

/**
 * Parses a phone number, removing all formatting and adding the international prefix
 * @returns {string} phone
 */
export function parse(number) {
	// Remove all dividing symbols
	number = number.replaceAll(/[\s\-\.\(\)]/g, "")

	if(!number) return undefined

	// Replace double 0 international prefix with +
	number = number.replace(/^00/, "+")

	// Add international prefix
	if(number.length > 10 && !number.startsWith("+")) number = `+${number}`

	// Remove trunk prefix
	if(number.length == 10 && number.startsWith("0")) number = number.slice(1)

	// Add default prefix, if needed
	if(!number.startsWith("+") && defaultPrefix) number = defaultPrefix + number

	return number
}

/**
 * Validates a phone number
 * @returns {boolean}
 */
export function validate(number) {
	if(!number) return false
	let {prefix, format} = findFormat(number)
	if(prefix.startsWith("+0") || prefix.length > 4) return false
	const targetLength = format.replaceAll(/[^x]/g, "").length + prefix.length
	return number.length == targetLength
}