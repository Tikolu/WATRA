import mongoose from "mongoose"
import Unit from "modules/schemas/role.js"

import element from "./element.js"
import FormResponse from "./response.js"

export class FormClass {
	/* * Static properties * */
	
	static defaultElements = [
		{type: "description", value: "Kliknij, aby edytować"},
		{type: "description", value: "Usuń tekst, aby usunąć element"},
	]
	
	/* * Properties * */
	
	name = {
		type: String,
		trim: true
	}

	unit = {
		type: String,
		ref: function() { return this.eventForm ? "Event" : "Unit" },
	}

	eventForm = Boolean

	elements = [element]

	config = {
		enabled: Boolean,
		requireResponse: Boolean,
		multipleResponses: Boolean
	}

	targetGroup = {
		mode: {
			type: String,
			enum: ["include", "exclude"],
			default: "exclude"
		},
		users: [{
			type: String,
			ref: "User"
		}]
	}

	
	/** * Getters * */

	/** Returns the full form name */
	get displayName() {
		return this.name || "(formularz bez nazwy)"
	}

	/* * Methods * */

	/** Adds an element to the form */
	async addElement(type) {
		const element = {
			type
		}

		this.elements.push(element)
		const newElement = this.elements.at(-1)

		newElement.config.create?.(this, newElement)
		
		await this.save()
		return newElement
	}

	/** Returns users for which a user can submit a response */
	async getResponseUserOptions(user, required=false) {
		let users = []

		// If form is within an event, return controlled profiles which have accepted participation
		if(this.eventForm) {
			for(const u of await user.getControlledProfiles()) {
				if(this.unit.participants.id(u.id)?.state != "accepted") continue
				users.push(u)
			}

		// If form is within a unit, return controlled profiles which are in the unit
		} else {
			for(const u of await user.getControlledProfiles()) {
				for await(const unit of u.listUnits(true)) {
					if(this.unit.id != unit.id) continue
					users.push(u)
					break
				}
			}
		}

		// Filter out users that are not in the target group
		if(this.targetGroup.mode == "include") {
			users = users.filter(u => this.targetGroup.users.includes(u.id))
		} else if(this.targetGroup.mode == "exclude") {
			users = users.filter(u => !this.targetGroup.users.includes(u.id))
		}

		// If form does not allow multiple responses, filter out users that already have a response
		if(!this.config.multipleResponses || required) {
			const existing = await this.getUserResponses(users, {submitted: required})
			
			// Form does not allow multiple responses - filter out users that already have a response
			if(!this.config.multipleResponses) {
				users = users.filter(u => existing.every(r => r.user.id != u.id))
			}

			// Required mode - return only user that do not have a response
			if(required) {
				users = users.filter(u => !existing.some(r => r.user.id == u.id))
			}

		}

		return users
	}

	/** Returns user's responses to this form */
	async getUserResponses(users, options = {}) {
		if(!Array.isArray(users)) users = [users]

		let operation = "find"
		if(options.check) operation = "findOne"
		else if(options.count) operation = "countDocuments"

		const query = {form: this.id}
		if(options.submitted) query.signature = {$ne: null}
		if(options.orSubmittedBy) {
			query.$or = [
				{user: users.map(u => u.id)},
				{submittedBy: options.orSubmittedBy.id}
			]
		} else {
			query.user = users.map(u => u.id)
		}
		
		return await FormResponse[operation](query)
	}
}

const schema = mongoose.Schema.fromClass(FormClass)

schema.beforeDelete = async function() {
	// Delete all responses
	await FormResponse.deleteMany({form: this.id})

	// Remove from unit
	await this.populate("unit")
	this.unit.forms = this.unit.forms.filter(f => f != this.id)
	await this.unit.save()
}

schema.permissions = await import("./permissions.js")

export default mongoose.model("Form", schema)