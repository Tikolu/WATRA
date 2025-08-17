import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.APPROVE)

	// Get approver from wyjazd
	const targetApprover = await targetWyjazd.getApprover(user)
	if(!targetApprover) {
		throw new HTTPError(404, "Nie jesteś zatwierdzającym")
	}

	if(targetApprover.approved) {
		throw new HTTPError(400, "Wyjazd już został zatwierdzony")
	}

	return html("wyjazd/approve", {
		user,
		targetWyjazd,
		targetApprover
	})
}