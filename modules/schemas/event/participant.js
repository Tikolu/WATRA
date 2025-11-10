import HTTPError from "modules/server/error.js"

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

	/** Sets the invitation state for the user */
	async setState(state) {
		const targetEvent = this.ownerDocument()
		
		await this.populate({
			"user": "parents"
		})
		
		// Ignore existing state
		if(this.state === state) return

		// Check participant eligibility
		if(!this.user.profileComplete) {
			throw new HTTPError(400, "Brakuje danych na profilu uczestnika")
		}
		// Check parent eligibility
		if(this.user.parents.length > 0) {
			if(this.user.parents.every(p => !p.profileComplete)) {
				throw new HTTPError(400, "Brakuje danych na profilu rodzica uczestnika")
			}
		}

		// Remove role if declined
		if(state == "declined") {
			const existingRole = await this.user.getRoleInUnit(targetEvent)
			if(existingRole) await existingRole.delete()
		}

		this.state = state
		await targetEvent.save()
	}

}