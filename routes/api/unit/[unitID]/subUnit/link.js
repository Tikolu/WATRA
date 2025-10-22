import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit"

export default async function({user, targetUnit, subUnitID}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)

	// Get subUnit from DB, and check if exists
	const subUnit = await Unit.findById(subUnitID)
	if(!subUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Check permission on subUnit
	await user.requirePermission(subUnit.PERMISSIONS.MODIFY)

	await targetUnit.addSubUnit(subUnit)

	return {
		subUnit: subUnitID
	}
}