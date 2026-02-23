import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetForm}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.CONFIG)

	let users, graph
	await targetForm.populate("unit")

	// Get users from event form
	if(targetForm.eventForm) {
		users = targetForm.unit.participants.filter(p => p.state == "accepted").map(p => p.user)
		await users.populate({}, {ref: "User"})

	// Get graph from unit form
	} else {
		graph = await targetForm.unit.getGraph()
	}

	return html("form/targetGroup", {
		user,
		targetForm,
		users,
		graph
	})
}