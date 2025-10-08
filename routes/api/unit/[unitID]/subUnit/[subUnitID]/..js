import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit.js"

export async function open({user, targetUnit, subUnitID}) {
	// Get subUnit from DB, and check if exists
	const targetSubUnit = await Unit.findById(subUnitID)
	if(!targetSubUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check if subUnit is in unit
	if(!targetUnit.subUnits.hasID(targetSubUnit.id)) {
		throw new HTTPError(403, "Jednostka nie jest w tej jednostce")
	}

	// Check permissions
	await user.requirePermission(targetSubUnit.PERMISSIONS.ACCESS)

	this.addRouteData({targetSubUnit})
}