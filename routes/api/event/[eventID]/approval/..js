import HTTPError from "modules/server/error.js"

export async function open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.APPROVE)

	// Get approver from event
	const targetApprover = targetEvent.getApprover(user)
	if(!targetApprover) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	this.addRouteData({targetApprover})
}