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

	const directMembers = await targetUnit.getMembers()

	// Find users that can be added
	const usersForAdding = []
	await user.populate("roles")
	const requiredOrg = orgContext || targetUnit.org
	for(const role of user.roles) {
		if(!role.hasTag("manageUser")) continue
		await role.populate("unit")
		for await(const user of role.unit.getSubMembers()) {
			// Skip users in different org
			if(requiredOrg && user.org != requiredOrg) continue
			// Skip users already on the list
			if(usersForAdding.hasID(user.id)) continue
			// Skip users which are already members
			if(directMembers.hasID(user.id)) continue

			usersForAdding.push(user)
		}
	}
	
	return html("unit/addUser", {
		units,
		orgContext,
		usersForAdding
	})
}