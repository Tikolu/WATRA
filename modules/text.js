export function capitalise(text) {
	if(!text || typeof text != "string") return ""
	text = text.toLowerCase()
	text = text[0].toUpperCase() + text.substring(1)
	return text
}