import HTTPError from "modules/server/error.js"

export async function open({user, targetWyjazd}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.APPROVE)

	// Get approver from wyjazd
	const targetApprover = targetWyjazd.getApprover(user)
	if(!targetApprover) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	this.addRouteData({targetApprover})
}