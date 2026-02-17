import randomID from "modules/randomID.js"

const elementTypes = {
	title: {
		name: "Tytuł"
	},
	description: {
		name: "Opis"
	},
	text: {
		name: "Pole tekstowe",
		validate(value) {
			return typeof value == "string"
		}
	}
}

export default class {
	/* * Static properties * */
	static elementTypes = elementTypes

	/* * Properties * */

	_id = {
		type: String,
		default: () => randomID(4)
	}
	
	type = {
		type: String,
		enum: Object.keys(elementTypes),
		required: true
	}

	text = {
		type: String,
		trim: true
	}

	/* * Getters * */

	get textContent() {
		return this.text || elementTypes[this.type]?.name || this.types
	}

	/* * Methods * */

	/** Checks a value against the element's validator */
	validateValue(value) {
		const validator = elementTypes[this.type]?.validate
		if(!validator) return false
		return validator(value)
	}
}