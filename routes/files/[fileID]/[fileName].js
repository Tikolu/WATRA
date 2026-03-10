import File from "modules/schemas/file.js"
import HTTPError from "modules/server/error.js"

export default async function({fileID, fileName, alt}) {
	if(!this.session.ensureActiveUser(this)) return

	// Find file
	const file = await File.findById(fileID, alt ? "-data" : "-altData")
	if(!file) throw new HTTPError(404)

	// Verify name
	if(file.name !== fileName) throw new HTTPError(404)

	// Get data
	let data
	if(alt) {
		const altEntry = file.altData.id(alt)
		if(!altEntry) throw new HTTPError(404)
		data = altEntry.data
	} else {
		data = file.data
	}

	// Set headers
	this.response.headers.set("Content-Type", file.type)
	this.response.headers.set("Cache-Control", "max-age=31536000")

	this.response.write(data)
	this.response.close()
}