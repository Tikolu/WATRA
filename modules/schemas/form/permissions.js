import Config from "modules/config.js"
import FormResponse from "./response.js"

/** Accessing the form */
export async function ACCESS(user) {
	// Block access from archived users
	if(user.archived) return false

	// Block access if user has no passkeys
	if(Config.passkeyRequired && user.auth.keys.length == 0) return false

	await this.populate("unit")
	// ACCESS_FORMS permission in the form's unit allows accessing the form
	if(await user.checkPermission(this.unit.PERMISSIONS.ACCESS_FORMS)) return true

	// If form is disabled, only allow access for users with responses to it
	if(!this.config.enabled) {
		const existingReponse = await this.getUserResponses(
			await this.getResponseUserOptions(user),
			{check: true}
		)
		if(!existingReponse) return false
	}

	return false
}

/** Editing the form */
export async function EDIT(user) {
	// Lack of ACCESS permission denies EDIT
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot edit form with responses
	const responseCount = await FormResponse.countDocuments({form: this.id, signature: {$ne: null}})
	if(responseCount > 0) return false

	// MANAGE_FORMS permission in the form's unit allows editing
	await this.populate("unit")
	if(await user.checkPermission(this.unit.PERMISSIONS.MANAGE_FORMS)) return true

	return false
}

/** Editing form configuration */
export async function CONFIG(user) {
	// Lack of ACCESS permission denies CONFIG
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// MANAGE_FORMS permission in the form's unit grants CONFIG
	await this.populate("unit")
	if(await user.checkPermission(this.unit.PERMISSIONS.MANAGE_FORMS)) return true

	return false
}

/** Accessing responses of other users */
export async function ACCESS_RESPONSES(user) {
	// Lack of ACCESS permission denies ACCESS_RESPONSES
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// MANAGE_FORMS permission in the form's unit allows accessing responses
	await this.populate("unit")
	if(await user.checkPermission(this.unit.PERMISSIONS.MANAGE_FORMS)) return true

	return false
}

/** Deleting the form */
export async function DELETE(user) {
	// Lack of ACCESS permission denies DELETE
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot delete form with responses
	const responseCount = await FormResponse.countDocuments({form: this.id})
	if(responseCount > 0) return false

	// MANAGE_FORMS permission in the form's unit allows deleting
	await this.populate("unit")
	if(await user.checkPermission(this.unit.PERMISSIONS.MANAGE_FORMS)) return true

	return false
}

/** Responding to the form */
export async function RESPOND(user) {
	// Lack of ACCESS permission denies RESPOND
	if(await user.checkPermission(this.PERMISSIONS.ACCESS, true) === false) return false

	// Cannot respond to disabled forms
	if(!this.config.enabled) return false

	// Cannot respond if no response user options are available
	const userOptions = await this.getResponseUserOptions(user)
	if(userOptions.length == 0) return false

	return true
}