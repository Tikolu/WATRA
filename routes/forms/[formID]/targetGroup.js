import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetForm}) {
	// Check permissions
	await user.requirePermission(targetForm.PERMISSIONS.CONFIG)

	await targetForm.populate("unit")

	// Get unit tree
	const tree = await targetForm.unit.getTree()

	return html("form/targetGroup", {
		user,
		targetForm,
		tree
	})
}