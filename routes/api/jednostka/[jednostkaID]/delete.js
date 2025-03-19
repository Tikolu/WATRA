import Jednostka from "modules/schemas/jednostka.js";

export default async function({user, targetJednostka}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.DELETE)
	
	await targetJednostka.deleteOne()
}