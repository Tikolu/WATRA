import Unit from "modules/schemas/unit.js";

export default async function({user, targetWyjazd}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY)
	
	await targetWyjazd.delete()
}