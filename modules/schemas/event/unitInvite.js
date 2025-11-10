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
		
		// Ensure all participants belong to unit
		await this.populate("unit")
		const members = await Array.fromAsync(this.unit.getSubMembers())
		const participants = []
		for(const participantID of participantIDs) {
			const participant = members.find(m => m.id == participantID)
			if(!participant) {
				throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem jednostki.")
			}
			participants.push(participant)
		}

		// Add new participants
		for(const participant of participants) {
			// Check if user already added
			if(targetEvent.participants.some(i => i.user.id == participant.id)) continue

			// Check if user has a role
			const existingRole = await participant.getRoleInUnit(targetEvent)
			if(existingRole) continue
			
			// Add user to invited
			targetEvent.participants.push({
				user: participant.id,
				state: "pending",
				originUnit: this.unit.id
			})
			
			// Remove any existing invite
			participant.eventInvites = participant.eventInvites.filter(i => i != targetEvent.id)
			
			// Add event invite to user
			participant.eventInvites.push(targetEvent.id)

			// Save user
			await participant.save()
		}

		// Remove participants not on list
		for(const participant of targetEvent.participants) {
			if(participant.originUnit != this.unit.id) continue
			if(participantIDs.includes(participant.user.id)) continue
		
			await participant.populate("user")

			// Remove invite from user
			participant.user.eventInvites = participant.user.eventInvites.filter(i => i != targetEvent.id)
			await participant.user.save()
			
			await participant.delete()
			
			// Remove user's role
			const existingRole = await participant.user.getRoleInUnit(targetEvent)
			if(existingRole) {
				await existingRole.populate(
					["unit", "user"],
					{known: [targetEvent, participant.user]}
				)
				await existingRole.delete()
			}
		}

		await targetEvent.save()
	}

	/** Uninvite unit from event */
	async uninvite() {
		const targetEvent = this.parent()
		
		// Uninvite users
		if(this.invitedParticipants > 0) {
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