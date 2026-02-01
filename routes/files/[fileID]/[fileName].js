import File from "modules/schemas/file.js"
import HTTPError from "modules/server/error.js"

export default async function({fileID, fileName}) {
	if(!this.session.ensureActiveUser(this)) return

	// Find file
	const file = await File.findById(fileID)
	if(!file) throw new HTTPError(404)

	// Verify name
	if(file.name !== fileName) throw new HTTPError(404)

	// Set headers
	this.response.headers.set("Content-Type", file.mimeType)
	this.response.headers.set("Cache-Control", "max-age=31536000")

	this.response.write(file.data)
	this.response.close()
}