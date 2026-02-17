import mongoose from "mongoose"

export class FormResponseClass {
	/* * Properties * */

	form = {
		type: String,
		ref: "Form",
		required: true,
		index: true
	}

	user = {
		type: String,
		required: true,
		ref: "User"
	}

	submittedBy = {
		type: String,
		ref: "User"
	}

	date = {
		type: Date,
		default: Date.now
	}

	elements = {}

	signature = {
		type: {
			name: String,
			time: Date
		}
	}

	/* * Methods * */
	async updateElement(element, value) {
		await this.populate("form")

		const formElement = this.form.elements.id(element.id)
		if(!formElement) throw new Error("Element nie istnieje")

		if(!formElement.validateValue(value)) throw new Error("Nieprawidłowa wartość")
		
		this.elements ||= {}
		this.elements[element.id] = value
		this.markModified("elements")

		this.date = Date.now()
		
		await this.save()
	}

	getElement(elementID) {
		return this.elements?.[elementID] || ""
	}

	async submit(user, signature) {
		if(this.submitted) throw new Error("Odpowiedź została już wysłana")

		// Enforce response limit
		await this.populate("form")
		if(!this.form.config.multipleResponses) {
			const existing = await this.form.getUserResponses(this.user, {
				submitted: true,
				check: true
			})
			if(existing) throw new Error("Odpowiedź została już wysłana")
		}

		// Verify signature
		await user.verifySignature(signature)

		this.signature = signature
		this.date = Date.now()
		this.submittedBy = user

		await this.save()
	}

	/* * Getters * */
	get submitted() {
		if(this.signature?.name && this.signature?.time) return true
		else return false
	}
}

const schema = mongoose.Schema.fromClass(FormResponseClass)

schema.permissions = {
	async ACCESS(user) {
		await this.populate("form")
		
		// ACCESS_RESPONSES permission on form grants ACCESS permission on response
		if(await user.checkPermission(this.form.PERMISSIONS.ACCESS_RESPONSES)) return true

		// User can access their own responses, and responses they submitted
		if(this.user.id == user.id) return true
		if(this.submittedBy?.id == user.id) return true

		// User can access responses of users they can APPROVE
		await this.populate("user")
		if(await user.checkPermission(this.user.PERMISSIONS.APPROVE)) return true

		return false
	},

	async EDIT(user) {
		await this.populate("form")
		
		// Lack of ACCESS permission denies EDIT permission
		if(!await user.checkPermission(this.form.PERMISSIONS.ACCESS)) return false
		
		// Check if user can respond to form
		if(!await user.checkPermission(this.form.PERMISSIONS.RESPOND)) return false

		// Check if user can respond to form
		if(!await user.checkPermission(this.form.PERMISSIONS.RESPOND)) return false
		
		// Cannot edit submitted response
		if(this.submitted) return false

		return true
	},

	async SUBMIT(user) {
		// Lack of EDIT permission denies SUBMIT permission
		if(!await user.checkPermission(this.PERMISSIONS.EDIT)) return false

		// APPROVE permission on user grants SUBMIT permission
		await this.populate("user")
		if(await user.checkPermission(this.user.PERMISSIONS.APPROVE)) return true

		return false
	}
}

const FormResponse = mongoose.model("FormResponse", schema, "formResponses")
export default FormResponse