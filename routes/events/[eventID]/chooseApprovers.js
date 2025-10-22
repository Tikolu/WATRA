import html from "modules/html.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.MODIFY)
	
	// Find approver candidates
	const approverOptions = await targetEvent.findApproverCandidates()

	// Load approver users
	await targetEvent.populate({
		"approvers": {
			"role": "user"
		}
	})
	
	return html("event/chooseApprovers", {
		user,
		targetEvent,
		approverOptions
	})
}