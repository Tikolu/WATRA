import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)
	
	// Get list of direct subunits
	await targetUnit.populate("subUnits")
	const units = [targetUnit, ...targetUnit.subUnits]
	
	return html("unit/createUser", {
		units
	})
}