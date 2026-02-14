import html from "modules/html.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent}) {
	// Check permissions
	await user.requirePermission(targetEvent.PERMISSIONS.INVITE_PARTICIPANT)

	const unitsTree = await user.listUnits(true).toArray()
	const topUnit = unitsTree.at(-1)

	const users = []
	for await(const subUnit of topUnit.getSubUnitsTree()) {
		await subUnit.populate("roles")
		for(const role of subUnit.roles) {
			// Display only public roles
			if(!role.hasTag("public")) continue
			// Skip duplicates
			if(users.hasID(role.user.id)) continue
			// Skip already added participants
			if(targetEvent.participants.id(role.user.id)) continue
			users.push(role.user.id)
		}
	}

	// Load and sort users
	await users.populate({}, {ref: "User"})
	users.sort((a, b) => a.displayName.localeCompare(b.displayName))

	return html("event/inviteParticipants", {
		user,
		users,
		targetEvent
	})
}