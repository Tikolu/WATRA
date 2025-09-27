import mongoose from "mongoose"

import randomID from "modules/randomID.js"

const eventTypes = {}

export class LogClass {
	/* * Properties * */
	_id = {
		type: String,
		default: () => Date.now().toString(36) + randomID(4),
	}
	
	user = {
		type: String,
		ref: "User"
	}

	eventType = {
		type: String,
		required: true,
		validate: /^[\p{Uppercase_Letter}0-9_]+$/u
	}

	targetUser = {
		type: String,
		ref: "User"
	}

	data = {}


	/* * Getters * */
	get time() {
		const time = Number.parseInt(this._id.slice(0, -4), 36)
		return new Date(time)
	}
	
	get description() {
		return eventTypes[this.eventType] || this.eventType
	}
}

const schema = mongoose.Schema.fromClass(LogClass)

export default mongoose.model("Log", schema)