import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.APPROVE)

	// Get approver from event
	const targetApprover = targetEvent.getApprover(user)
	if(!targetApprover) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	if(targetApprover.approved) {
		throw new HTTPError(400, "Akcja już została zatwierdzona")
	}

	return html("event/approve", {
		user,
		targetEvent,
		targetApprover
	})
}