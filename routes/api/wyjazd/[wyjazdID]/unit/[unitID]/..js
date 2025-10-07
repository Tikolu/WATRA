import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit.js"

export async function open({user, targetWyjazd, unitID}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY)
	
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Unit nie istnieje")

	this.addRouteData({targetUnit})
}