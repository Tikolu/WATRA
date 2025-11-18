import mongoose from "mongoose"
import { Buffer } from "node:buffer"
import AAGUIDs from "aaguid.json" with { type: "json" }

import User from "modules/schemas/user"

export class PasskeyClass {
	_id = {
		type: String,
		validate: /^[0-9a-zA-Z_-]{8,1024}$/
	}
	
	pk = {
		alias: "publicKey",
		type: Buffer,
		required: true
	}
	
	aaguid = String

	user = {
		type: String,
		ref: "User",
		required: true
	}

	created = {
		type: Date,
		default: Date.now
	}

	lastUsed = Date

	get provider() {
		return AAGUIDs[this.aaguid]
	}
}

const schema = mongoose.Schema.fromClass(PasskeyClass)

schema.beforeDelete = async function() {
	// Remove reference from user
	await this.populate("user")
	this.user.auth.keys = this.user.auth.keys.filter(k => k.id != this.id)
	await this.user.save()
}

export default mongoose.model("Passkey", schema)