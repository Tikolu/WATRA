import html from "modules/html.js"

export default async function({user, targetUnit}) {
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_MEMBERS)
	
	// Generate graph
	const graph = await targetUnit.getGraph()

	// Load archived users
	if(await user.checkPermission(targetUnit.PERMISSIONS.ACCESS_ARCHIVED_MEMBERS)) {
		await targetUnit.populate("archivedUsers")
	}

	return html("unit/memberList", {
		user,
		targetUnit,
		graph
	})
}