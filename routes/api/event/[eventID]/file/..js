import HTTPError from "modules/server/error.js"
import File from "modules/schemas/file.js"

export async function _open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	// Remove any approvals of the event
	for(const approver of targetEvent.approvers) {
		approver.approvedAt = undefined
	}
}

export async function add({user, targetEvent, files, access}) {
	if(!files?.length) throw new HTTPError(400, "Nie załączono dokumentu")
	if(files.length > 1) throw new HTTPError(400, "Można dodać tylko jeden dokument na raz")
	if(targetEvent.files.length > 4) throw new HTTPError(400, "Limit 4 dokumentów na akcję")

	// Check access
	if(access.includes("participant")) access = "participant"
	else if(access.includes("role")) access = "role"
	else access = "owner"

	// Check file
	const file = await File.fromJSON(files[0])
	if(file.type != "application/pdf") {
		throw new Error("Nieobsługiwany typ pliku")
	}

	targetEvent.files.push({file, access})
	await targetEvent.save()

	await file.save()
}