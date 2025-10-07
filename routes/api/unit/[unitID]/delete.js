import Unit from "modules/schemas/unit.js";

export default async function({user, targetUnit}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.DELETE)
	
	await targetUnit.delete()
}