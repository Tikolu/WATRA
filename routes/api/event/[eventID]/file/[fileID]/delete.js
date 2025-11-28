import HTTPError from "modules/server/error.js"

import File from "modules/schemas/file.js"

export default async function({user, targetEvent, fileID}) {
	// Get file
	const file = targetEvent.files.id(fileID)
	if(!file) throw new HTTPError(404, "Dokument nie istnieje")

	await file.populate("file", {select: "name"})
	
	// Delete file
	await file.file.delete()

	// Remove reference from event and save event
	await file.delete()
	await targetEvent.save()
}