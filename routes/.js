import html from "modules/html.js"

export default async function({user}) {
	if(!user) return this.response.redirect("/login")

	await user.populate({
		"children": {
			"eventInvites": {},
			"roles": "unit"
		},
		"roles": "unit",
		"eventRoles": "unit",
		"eventInvites": {}
	})

	// Check permissions
	await user.checkPermission(user.PERMISSIONS.EDIT)
	await user.checkPermission(user.PERMISSIONS.APPROVE)

	const events = [
		...user.eventInvites,
		...user.eventRoles.map(f => f.unit),
		...user.children.flatMap(c => c.eventInvites)
	].unique("id")
	
	return html("main", {
		user,
		events
	})
}