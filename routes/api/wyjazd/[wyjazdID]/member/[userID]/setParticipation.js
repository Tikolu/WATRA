import HTTPError from "modules/server/error.js"

export default async function({user, targetWyjazd, targetUser, participation}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE, "Brak dostępu do użytkownika")

	// Check if target user is a participant
	const targetInvitation = targetWyjazd.findUserInvite(targetUser)
	if(!targetInvitation) throw new HTTPError(404, "Użytkownik nie jest uczestnikiem tego wyjazdu")

	if(typeof participation != "boolean") throw new HTTPError(400)

	// Set participation state
	await targetInvitation.setState(participation ? "accepted" : "declined")

	return {
		participation
	}
}