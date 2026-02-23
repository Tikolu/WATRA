import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user"

export default async function({targetInvitation, userIDs}) {
	const participantIDs = Array.create(userIDs).unique()
	
	await targetInvitation.setParticipants(participantIDs)

	return {
		participantIDs
	}
}