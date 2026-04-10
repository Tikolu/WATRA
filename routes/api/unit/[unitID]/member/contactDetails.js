import contactLinkHandler from "routes/api/contactDetails.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetUnit, userIDs}) {
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_MEMBERS)

	const targetUsers = Array.create(userIDs).unique()
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

	this.addRouteData({targetUsers})

	// Disable logging
	this.logging.disabled = true
	
	return contactLinkHandler(this.routeData)
}