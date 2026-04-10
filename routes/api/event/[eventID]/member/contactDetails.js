import contactLinkHandler from "routes/api/contactDetails.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, userIDs}) {
	// Disable logging
	this.logging.disabled = true

	const targetUsers = Array.create(userIDs).unique()
	await targetUsers.populate({}, {
		ref: "User",
		placeholders: new HTTPError(404, "Użytkownik nie istnieje")
	})
	for(const targetUser of targetUsers) {
		const participant = targetEvent.participants.id(targetUser.id)
		if(!participant) {
			throw new HTTPError(400, `Użytkownik ${targetUser.displayName} nie jest uczestnikiem akcji`)
		}
		if(!await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
			await participant.populate("originUnit")
			if(!participant.originUnit || !await user.checkPermission(participant.originUnit.PERMISSIONS.MANAGE_INVITES)) {
				throw new HTTPError(403)
			}
		}
	}

	this.addRouteData({
		targetUsers,
		targetUnit: targetEvent
	})
	return contactLinkHandler(this.routeData)
}