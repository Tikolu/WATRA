import html from "modules/html.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, orgContext}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.SET_ROLE)

	// Get user's role in unit, unless user has SET_ROLE permission in an upperUnit
	let userRole = await user.getRoleInUnit(targetUnit)
	await targetUnit.populate("upperUnits")
	for await(const upperUnit of targetUnit.traverse("upperUnits")) {
		if(await user.checkPermission(upperUnit.PERMISSIONS.SET_ROLE)) {
			userRole = null
			break
		}
	}
	
	// Create list of role options
	const roleOptions = []
	for(const roleID of targetUnit.config.roles) {
		// Skip roles higher than user's role
		const role = Config.roles[roleID]
		if(userRole && userRole.config.rank < role.rank) continue
		roleOptions.push(roleID)
	}

	// Generate tree
	const tree = await targetUnit.getTree({
		sortMembers: true
	})
	
	return html("unit/setRole", {
		user,
		targetUnit,
		roleOptions,
		tree
	})
}