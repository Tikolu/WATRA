import Unit from "modules/schemas/unit"
import HTTPError from "modules/server/error.js";

export default async function({user, targetEvent, unitIDs}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.EDIT)

	const units = unitIDs.unique()
	await units.populate({}, {ref: "Unit"})
	
	// Check permissions
	await targetEvent.populate("upperUnits")
	for(const unit of [...units, ...targetEvent.upperUnits]) {
		if(!await user.checkPermission(unit.PERMISSIONS.CREATE_EVENT)) {
			throw new HTTPError(403, `Brak dostępu do jednostki "${unit.displayName}"`)
		}
	}
	
	await targetEvent.setUpperUnits(units)

	return {
		upperUnits: targetEvent.upperUnits.map(unit => unit.id)
	}
}