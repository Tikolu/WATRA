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

	const directMembers = await targetUnit.getMembers()

	// Find users that can be added
	const usersForAdding = {}

	const requiredOrg = /*orgContext ||*/ targetUnit.org
	function addUser(unit, user) {
		// Skip users in different org
		if(requiredOrg && user.org != requiredOrg) return
		// Skip users already on the list
		for(const unitName in usersForAdding) {
			if(usersForAdding[unitName].hasID(user.id)) return
		}
		// Skip users which are already members
		if(directMembers.hasID(user.id)) return

		usersForAdding[unit.displayName] ||= []
		usersForAdding[unit.displayName].push(user)
	}
	
	await user.populate("roles")
	for(const role of user.roles) {
		if(!role.hasTag("manageUser")) continue
		await role.populate("unit")
		// Add direct members
		for(const user of await role.unit.getMembers()) addUser(role.unit, user)
		// Add members of all subUnits
		for await(const subUnit of role.unit.getSubUnitsTree()) {
			for(const user of await subUnit.getMembers()) addUser(subUnit, user)
		}
	}

	return html("unit/member/add", {
		targetUnit,
		orgContext,
		usersForAdding
	})
}