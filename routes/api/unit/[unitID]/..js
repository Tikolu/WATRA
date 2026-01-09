import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit"

export async function _open({user, unitID}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS)

	this.addRouteData({targetUnit})
}