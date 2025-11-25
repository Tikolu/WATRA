import mongoose from "mongoose"
import mime from "mime"
import { Buffer } from "node:buffer"

import randomID from "modules/randomID.js"

const MAX_FILE_SIZE = 8 * 1024 * 1024

export class FileClass {
	/* * Static functions * */
	static async fromJSON(json) {
		const {name, data} = json
		if(!name || !data) throw new Error("Invalid file")

		// Load file from data URL
		if(!data.startsWith("data:")) throw new Error("Invalid file data")
		const response = await fetch(data)
		const buffer = await response.bytes()

		// Check file size
		if(buffer.byteLength > MAX_FILE_SIZE) {
			throw new Error("File too large")
		}

		// Check file type
		const type = response.headers.get("Content-Type")
		if(!type || mime.getType(name) != type) {
			throw new Error("Invalid file type")
		}

		return new this({
			data: Buffer.from(buffer),
			type,
			name
		})
	}
	
	/* * Properties * */
	_id = {
		type: String,
		default: () => randomID(16)
	}
	
	data = {
		type: Buffer,
		required: true
	}

	type = {
		type: String,
		required: true
	}
	
	uploader = {
		type: String,
		ref: "User"
	}

	name = {
		type: String,
		required: true
	}
}

const schema = mongoose.Schema.fromClass(FileClass)

export default mongoose.model("File", schema)