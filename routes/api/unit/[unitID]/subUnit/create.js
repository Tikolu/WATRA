import HTTPError from "modules/server/error.js";
import Unit from "modules/schemas/unit";

export default async function({user, targetUnit, type, name="", org}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ADD_SUBUNIT)
	
	// Create unit, calculating type if not specified
	const subUnit = new Unit({
		type: type || (targetUnit.type - 1),
		name,
		org
	})

	await targetUnit.addSubUnit(subUnit)

	// Save subUnit to DB
	await subUnit.save()

	// Return subUnit ID
	return {
		subUnitID: subUnit.id
	}
}