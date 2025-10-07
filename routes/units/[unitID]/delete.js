import html from "modules/html.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.DELETE)
	
	// Check permissions for upperUnits
	await targetUnit.populate("upperUnits")
	for(const upperUnit of targetUnit.upperUnits) {
		await user.checkPermission(upperUnit.PERMISSIONS.MODIFY)
	}
	
	return html("unit/delete", {
		user,
		targetUnit
	})
}