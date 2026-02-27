import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.INVITE_PARTICIPANT)

	const unitsTree = await user.listUnits(true).toArray()
	const topUnit = unitsTree.at(-1)

	// Generate tree
	const tree = await topUnit.getTree({
		roleFilter: (unit, role) => user.checkPermission(unit.PERMISSIONS.CREATE_USER),
		userFilter: async u => {
			// Exclude users that are already invited
			if(targetEvent.participants.hasID(u.id)) return false

			// Include users with public role
			await u.populate("roles")
			for(const role of u.roles) {
				if(role.hasTag("public")) return true
			}

			// Include users to which the user has access
			return await user.checkPermission(u.PERMISSIONS.ACCESS)
		},
		sortMembers: true	
	})

	return html("event/inviteParticipants", {
		user,
		targetEvent,
		tree
	})
}