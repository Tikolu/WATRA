import Config from "modules/config.js"
import HTTPError from "modules/server/error.js"

import Unit from "modules/schemas/unit"

export async function open({user, unitID, org: orgContext}) {
	// Get unit from DB, and check if exists
	const targetUnit = await Unit.findById(unitID)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")

	// Ensure org exists
	if(orgContext && !Config.orgs[orgContext]) {
		throw new HTTPError(404, "Organizacja nie istnieje")
	}

	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS, "Nie masz dostępu do tej jednostki")

	this.addRouteData({targetUnit, orgContext})
}