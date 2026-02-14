import html from "modules/html.js"
import Config from "modules/config.js"
import Graph from "modules/schemas/unit/graph.js"

export default async function({user, targetUnit}) {

	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.CREATE_USER)
	
	const directMembers = await targetUnit.listMembers(false).toArray()
	
	// Generate graph
	const graph = await user.getGraph({
		roleFilter: (unit, role) => user.checkPermission(unit.PERMISSIONS.CREATE_USER),
		userFilter: user => directMembers.every(m => m.id != user.id),
		processNodes: async node => {
			// Add user's parents
			await node.members.populate({"parents": "children"})
			const parents = []
			for(const parent of node.members.flatMap(u => u.parents)) {
				// Skip parents who never logged in
				if(!parent.auth.lastLogin) continue

				parent.description = `(${parent.children.map(c => c.displayName).join(", ")})`
				parents.push(parent)
			}
			
			if(parents.length) {
				node.subUnits.push(new Graph({
					unit: {displayName: "Rodzice"},
					members: parents
				}))
			}
		},
		sortMembers: true
	})

	return html("unit/member/add", {
		targetUnit,
		graph
	})
}