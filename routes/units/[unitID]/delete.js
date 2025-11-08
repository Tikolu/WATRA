import html from "modules/html.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.EDIT)
	
	// Check permissions for upperUnits
	await targetUnit.populate("upperUnits")
	for(const upperUnit of targetUnit.upperUnits) {
		await user.checkPermission(upperUnit.PERMISSIONS.ADD_SUBUNIT)
	}
	
	return html("unit/delete", {
		user,
		targetUnit
	})
}