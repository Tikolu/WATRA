import HTTPError from "modules/server/error.js"
import Signature from "modules/schemas/user/signature.js"

export default class {
	user = {
		type: String,
		ref: "User",
		deriveID: true
	}

	state = {
		type: String,
		enum: ["pending", "accepted", "declined"],
		default: "pending"
	}

	originUnit = {
		type: String,
		ref: "Unit"
	}

	signature = Signature

	/** Sets the invitation state for the user */
	async setState(state, signature) {
		const targetEvent = this.ownerDocument()
		
		await this.populate({
			"user": "parents"
		})
		
		// Ignore existing state
		if(this.state === state) return

		if(state == "accepted" && !targetEvent.registrationOpen) {
			throw new HTTPError(400, "Rejestracja na tę akcję jest zamknięta")
		}

		// Remove role if declined
		if(state == "declined") {
			const existingRole = await this.user.getRoleInUnit(targetEvent)
			if(existingRole) await existingRole.delete()

		} if(state == "accepted") {
			// Check participant eligibility
			if(!this.user.confirmed) {
				throw new HTTPError(400, "Dane uczestnika nie zostały zatwierdzone")
			}
			
			// Add role if direct participant
			if(!this.originUnit) {
				const existingRole = await this.user.getRoleInUnit(targetEvent)
				if(!existingRole) {
					await targetEvent.setRole(this.user, undefined)
				}
			}
		}

		// Save signature if accepting
		this.signature = state == "accepted" ? signature : undefined

		this.state = state
		await targetEvent.save()
	}

	/** Uninvites the participant and removes them from the event */
	async uninvite(saveEvent=true) {
		const targetEvent = this.parent()

		await targetEvent.validate()
		
		await this.populate("user")

		// Remove invite from user
		this.user.eventInvites = this.user.eventInvites.filter(i => i != targetEvent.id)
		await this.user.save()

		// Remove user's role
		const existingRole = await this.user.getRoleInUnit(targetEvent)
		if(existingRole) {
			await existingRole.populate(
				["unit", "user"],
				{known: [targetEvent, this.user]}
			)
			await existingRole.delete()
		}

		// Remove from event
		this.delete()

		if(saveEvent) await targetEvent.save()
	}

}