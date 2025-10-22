import HTTPError from "modules/server/error.js";
import Unit from "modules/schemas/unit";

export default async function({user, targetUnit, type, name=""}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Create unit, calculating type if not specified
	const subUnit = new Unit({
		type: type || (targetUnit.type - 1),
		name
	})

	await targetUnit.addSubUnit(subUnit)

	// Save subUnit to DB
	await subUnit.save()

	// Return subUnit ID
	return {
		subUnitID: subUnit.id
	}
}