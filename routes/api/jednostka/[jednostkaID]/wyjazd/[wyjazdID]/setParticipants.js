import HTTPError from "modules/server/error.js"
import User from "modules/schemas/user";

export default async function({targetInvitation, participants: participantIDs=[]}) {
	await targetInvitation.setParticipants(participantIDs)
}