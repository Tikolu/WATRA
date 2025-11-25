import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	// Ensure org exists
	if(orgContext && !Config.orgs[orgContext]) {
		throw new HTTPError(404, "Organizacja nie istnieje")
	}
	orgContext ||= targetUnit.org 

	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)
	
	// Get list of direct subunits
	await targetUnit.populate("subUnits")
	const units = [targetUnit, ...targetUnit.subUnits]
	
	return html("unit/member/create", {
		units,
		orgContext
	})
}