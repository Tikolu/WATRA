import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get list of direct subunits
	await targetUnit.populate("subUnits")
	const units = [targetUnit, ...targetUnit.subUnits]
	
	return html("unit/createUser", {
		units
	})
}