import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit"

export async function open({user, targetEvent, unitID}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)
	
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	this.addRouteData({targetUnit})
}