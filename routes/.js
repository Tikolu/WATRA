import html from "modules/html.js"
import Event from "modules/schemas/event.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate({
		"children": {
			"eventInvites": {},
			"roles": "unit"
		},
		"roles": "unit",
		"eventRoles": "unit",
		"eventInvites": {},
		"eventApprovalRequests": {}
	})

	// Check permissions
	await user.checkPermission(Event.PERMISSIONS.CREATE)
	await user.checkPermission(user.PERMISSIONS.MODIFY)

	const events = [
		...user.eventInvites,
		...user.eventApprovalRequests,
		...user.eventRoles.map(f => f.unit),
		...user.children.flatMap(c => c.eventInvites)
	].unique("id")
	
	return html("main", {
		user,
		events
	})
}