import html from "modules/html.js"

export default async function({user, targetWyjazd}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY)
	
	// Find approver candidates
	const approverOptions = await targetWyjazd.findApproverCandidates()

	// Load approver users
	await targetWyjazd.populate({
		"approvers": {
			"funkcja": "user"
		}
	})
	
	return html("wyjazd/chooseApprovers", {
		user,
		targetWyjazd,
		approverOptions
	})
}