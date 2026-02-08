import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit}) {

	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)

	const directMembers = await targetUnit.getMembers()

	// Find users that can be added
	const usersForAdding = {}
	const parents = []
	
	async function addUser(unit, user) {
		// Add user's parents
		await user.populate({"parents": "children"})
		for(const parent of user.parents) {
			parent.description = `(${parent.children.map(c => c.displayName).join(", ")})`
			parents.push(parent)
		}

		// Skip users in different org
		if(targetUnit.org && user.org != targetUnit.org) return
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
		for(const user of await role.unit.getMembers()) await addUser(role.unit, user)
		// Add members of all subUnits
		for await(const subUnit of role.unit.getSubUnitsTree()) {
			for(const user of await subUnit.getMembers()) await addUser(subUnit, user)
		}
	}

	usersForAdding["Rodzice"] = parents.unique()

	return html("unit/member/add", {
		targetUnit,
		usersForAdding
	})
}