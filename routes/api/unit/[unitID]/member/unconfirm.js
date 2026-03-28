import HTTPError from "modules/server/error.js"
import Config from "modules/config.js"

export default async function({user, targetUnit, userIDs}) {
	// Check permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_MEMBERS, "Brak dostępu do jednostki")

	const targetUsers = Array.create(userIDs).unique()
	
	if(!targetUsers.length) {
		throw new HTTPError(400, "Nie wybrano użytkowników")
	}

	await targetUsers.populate({}, {
		ref: "User",
		placeholders: new HTTPError(404, "Użytkownik nie istnieje")
	})

	const members = targetUnit.listMembers(true)
	for(const targetUser of targetUsers) {
		// Check if member belongs to the unit
		if(!await members.find(u => u.id == targetUser.id)) {
			throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie należy do jednostki`)
		}
	}

	let updateCount = 0
	for(const targetUser of targetUsers) {
		if(targetUser.confirmed) continue
		updateCount += 1
		await targetUser.unconfirmDetails()
	}

	return {
		userIDs: targetUsers.map(u => u.id),
		updated: updateCount
	}
}