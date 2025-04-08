import Jednostka from "modules/schemas/jednostka.js";

export default async function({user, targetWyjazd}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.DELETE)
	
	await targetWyjazd.delete()
}