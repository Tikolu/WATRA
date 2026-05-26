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
		input(value) {
			return typeof value == "string"
		}
	},
	choice: {
		name: "Wybór",
		create(form, element) {
			element.value = {
				text: "Wybór",
				options: ["Opcja 1", "Opcja 2", "Opcja 3"],
			}
		},
		setValue(value) {
			if(
				!Object.keys(value).equals(["text", "options"]) ||
				!Array.isArray(value.options) ||
				typeof value.text != "string"
			) throw new Error("Nieprawidłowa wartość")
			value.options = value.options.map(option => option.trim()).unique().filter(option => option)
			if(!value.options.length) value.options = ["Opcja 1"]
			return value
		},
		getText(value) {
			return value.text
		},
		input(value) {
			if(typeof value != "string") return false
			if(!this.value?.options.includes(value)) throw new Error("Wybierz jedną z dostępnych opcji")
			return true
		}
	},
	payment: {
		name: "Płatność",
		create(form, element) {
			for(const formElement of form.elements) {
				if(formElement == element) continue
				if(formElement.type == "payment") throw new Error("W formularzu jest już element płatności")
			}
		},
		setValue(value) {
			value = Number(value)
			if(isNaN(value) || value <= 0) throw new Error("Nieprawidłowa kwota")
			return Math.round(value * 100) / 100
		},
		getValue(value) {
			return value || 0
		},
		submit(value) {
			if(value?.state != "paid") throw new Error("Dokonaj płatności, aby wysłać formularz")
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

	value = {
		type: {},
		set: function(value) {
			if(this.config.setValue) return this.config.setValue(value)
			else return value
		},
		get: function(value) {
			if(this.config.getValue) return this.config.getValue(value)
			else return value || elementTypes[this.type]?.name || this.type
		}
	}

	/* * Getters * */

	get config() {
		return elementTypes[this.type]
	}

	get text() {
		if(this.config.getText) return this.config.getText(this.value)
		else if(typeof this.value == "string") return this.value
		else return this.config.name || this.type
	}

	/* * Methods * */

	/** Checks input against the element's validator */
	validateInput(value) {
		const validator = this.config?.input
		if(!validator) return false
		return validator.call(this, value)
	}
}