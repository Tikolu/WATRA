import HTTPError from "modules/server/error.js"

async function getApprover(targetEvent, user) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.APPROVE)

	// Get approver from event
	const approver = targetEvent.getApprover(user)
	if(!approver) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	return approver
}

export async function approve({user, targetEvent, signature}) {
	const targetApprover = await getApprover(targetEvent, user)
	this.addRouteData({targetApprover})

	// Verify signature
	await user.verifySignature(signature)
	
	await targetApprover.approve()
}

export async function unapprove({user, targetEvent}) {
	const targetApprover = await getApprover(targetEvent, user)
	this.addRouteData({targetApprover})

	await targetApprover.unapprove()
}

export async function clear({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MANAGE)

	await targetEvent.clearApprovals()
}