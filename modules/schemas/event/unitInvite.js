import HTTPError from "modules/server/error.js"

export default class {
	unit = {
		type: String,
		ref: "Unit",
		deriveID: true
	}

	state = {
		type: String,
		enum: ["pending", "accepted", "declined"],
		default: "pending"
	}

	/** Sets participants for the event, by inviting users from the unit */
	async setParticipants(participantIDs) {
		const targetEvent = this.parent()
		
		// Ensure invitation has been accepted
		if(this.state != "accepted") {
			throw new HTTPError(400, "Zaproszenie na akcję nie zostało zaakceptowane")
		}

		const eventOrg = await targetEvent.getOrg()
		
		await this.populate("unit")
		const members = this.unit.listMembers(true)
		const participants = []
		for(const participantID of participantIDs) {
			const participant = await members.find(m => m.id == participantID)
			// Ensure all participants belong to unit
			if(!participant) {
				throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem jednostki.")
			}
			// Ensure all participants are in the same org as event
			if(eventOrg && participant.org && participant.org != eventOrg) {
				throw new HTTPError(400, "Nie można dodać uczestnika z innej organizacji.")
			}
			participants.push(participant)
		}

		// Add new participants
		for(const participant of participants) {
			await targetEvent.inviteParticipant(participant, this.unit, false)
		}

		// Remove participants not on list
		for(const participant of [...targetEvent.participants]) {
			if(participant.originUnit != this.unit.id) continue
			if(participantIDs.includes(participant.user.id)) continue

			await participant.uninvite()
		}

		await targetEvent.save()
	}

	/** Uninvite unit from event */
	async uninvite() {
		const targetEvent = this.parent()
		
		// Uninvite users
		if(this.invitedParticipants.length > 0) {
			await this.setParticipants([])
		}

		// Remove event invitation from unit
		await this.populate("unit")
		this.unit.eventInvites = this.unit.eventInvites.filter(i => i.id != targetEvent.id)
		
		// Delete invitation
		this.delete()


		await targetEvent.save()
		await this.unit.save()
	}

	/** List of participants invited from this unit */
	get invitedParticipants() {
		const targetEvent = this.parent()
		return targetEvent.participants.filter(p => p.originUnit == this.unit.id)
	}
}