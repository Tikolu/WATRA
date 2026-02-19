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
	async getResponseUserOptions(user, required=false, submitted=false) {
		let users = []

		if(this.eventForm) {
			if(this.unit.participants.id(user.id)?.state == "accepted") users.push(user)

			await user.populate("children")
			for(const child of user.children) {
				if(this.unit.participants.id(child.id)?.state == "accepted") users.push(child)
			}

		} else {
			for await(const unit of user.listUnits(true)) {
				if(this.unit.id != unit.id) continue
				users.push(user)
				break
			}
			
			await user.populate("children")
			for(const child of user.children) {
				if(!await user.checkPermission(child.PERMISSIONS.APPROVE)) continue
				for await(const unit of child.listUnits(true)) {
					if(this.unit.id != unit.id) continue
					users.push(child)
					break
				}
			}
		}

		if(!this.config.multipleResponses || required) {
			const existing = await this.getUserResponses(users, {submitted})
			
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
		query.user = users.map(u => u.id)
		
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