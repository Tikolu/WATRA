import Unit from "modules/schemas/unit.js"
import HTTPError from "modules/server/error.js"

export async function open({user, unitID}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Unit nie istnieje")

	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS, "Nie masz dostępu do tej units")

	this.addRouteData({targetUnit})
}