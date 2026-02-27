import html from "modules/html.js"
import Config from "modules/config.js"
import UnitTree from "modules/schemas/unit/tree.js"

export default async function({user, targetUser, action}) {
	// Check for permissions
	await user.requirePermission(targetUser.PERMISSIONS.ADD_PARENT)

	// Generate tree
	const tree = await user.getTree({
		roleFilter: (unit, role) => role.hasTag("manageSubUnit"),
		processNodes: async node => {
			// Add user's parents
			await node.members.populate({"parents": "children"})
			const parents = []
			for(const parent of node.members.flatMap(u => u.parents)) {
				parent.description = `(${parent.children.map(c => c.displayName).join(", ")})`
				parents.push(parent)
			}
			
			if(parents.length) {
				node.subUnits.push(new UnitTree({
					unit: {displayName: "Rodzice"},
					members: parents
				}))
			}
		},
		userFilter: u => {
			// Skip self
			if(u.id == targetUser.id) return false
			// Skip users which are not adults
			if(u.isAdult === false) return false
			// Skip users who are already parents of user
			if(targetUser.parents.some(parent => parent.id == u.id)) return false

			return true
		},
		sortMembers: (a, b) => {
			// Sort, priorising same last name
			if(!a.name.last || !b.name.last) return 0
			if(!a.name.first || !b.name.first) return 0
			const aSameLastName = (a.name.last.includes(targetUser.name.last) || targetUser.name.last.includes(a.name.last)) ? 1 : 0
			const bSameLastName = (b.name.last.includes(targetUser.name.last) || targetUser.name.last.includes(b.name.last)) ? 1 : 0
			if(aSameLastName != bSameLastName) return bSameLastName - aSameLastName
			return a.name.last.localeCompare(b.name.last) || a.name.first.localeCompare(b.name.first)
		}
	})

	// Find other parents of user's children
	await user.populate("children")
	for(const child of user.children) {
		await child.populate({"parents": "children"})
		for(const parent of child.parents) {
			if(parent.id == user.id) continue
			parent.description = `(${parent.children.map(c => c.displayName).join(", ")})`
			tree.members.push(parent)
		}
	}

	return html("user/addParent", {
		user,
		targetUser,
		tree,
		action
	})
}