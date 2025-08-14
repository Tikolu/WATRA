import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user.js";

export default async function({targetInvitation, participants: participantIDs=[]}) {
	await targetInvitation.setParticipants(participantIDs)
}