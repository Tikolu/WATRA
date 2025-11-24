import HTTPError from "modules/server/error.js"

export default class {
	role = {
		type: String,
		ref: "Role",
		deriveID: true
	}

	approvedAt = {
		type: Date
	}
	
	/** Get the approval state of this approver */
	get approved() {
		return this.approvedAt != null
	}

	/** Approves the event */
	async approve() {
		const targetEvent = this.parent()
		
		if(targetEvent.missingDetails.length > 0) {
			throw new HTTPError(400, "Nie można zatwierdzić akcji z brakującymi szczegółami")
		}
		
		if(this.approved) {
			throw new HTTPError(400, "Akcja już została zatwierdzona")
		}

		this.approvedAt = new Date()
		await targetEvent.save()
	}

	/** Unapproves the event */
	async unapprove() {
		if(!this.approved) {
			throw new HTTPError(400, "Akcja nie jest zatwierdzona")
		}

		this.approvedAt = null
		await this.parent().save()
	}
}