import HTTPError from "modules/server/error.js"

export async function _open({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.APPROVE)

	// Get approver from event
	const targetApprover = targetEvent.getApprover(user)
	if(!targetApprover) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	this.addRouteData({targetApprover})
}

export async function approve({user, targetApprover, signature}) {
	// Verify signature
	await user.verifySignature(signature)
	
	await targetApprover.approve()
}

export async function unapprove({targetApprover}) {
	await targetApprover.unapprove()
}