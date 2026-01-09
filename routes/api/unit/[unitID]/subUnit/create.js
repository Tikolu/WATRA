import HTTPError from "modules/server/error.js"
import Unit from "modules/schemas/unit"

export default async function({user, targetUnit, type, name="", org}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.ADD_SUBUNIT)

	if(!org) org = undefined
	
	// Create unit
	const subUnit = new Unit({type, name, org})
	await subUnit.validate()

	// Add unit to upper unit
	await targetUnit.addSubUnit(subUnit)

	// Save subUnit to DB
	await subUnit.save()

	// Return subUnit ID
	return {
		subUnitID: subUnit.id
	}
}