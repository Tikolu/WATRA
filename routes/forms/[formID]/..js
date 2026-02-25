import html from "modules/html.js"
import Config from "modules/config.js"
import HTTPError from "modules/server/error.js"

import Form from "modules/schemas/form"
import FormResponse from "modules/schemas/form/response.js"

export async function _open({user, formID}) {
	// Get form from DB, and check if exists
	const targetForm = await Form.findById(formID)
	if(!targetForm) throw new HTTPError(404, "Formularz nie istnieje")

	await user.requirePermission(targetForm.PERMISSIONS.ACCESS, "Nie masz dostępu do tego formularza")

	this.addRouteData({targetForm})
}

export default async function({user, targetForm}) {
	// Check all permissions
	await user.checkPermission(targetForm.PERMISSIONS)

	let responses = []
	const counts = {
		required: 0,
		submitted: 0,
		drafts: 0
	}
	if(user.hasPermission(targetForm.PERMISSIONS.ACCESS_RESPONSES)) {
		// Get all responses to this form
		responses = await FormResponse.find({form: targetForm.id})
		await responses.populate("user")

		for(const response of responses) {
			if(response.submitted) counts.submitted += 1
			else counts.drafts += 1
		}

		// Get count of required responses
		if(targetForm.config.requireResponse) {
			let requiredUsers = []
			if(targetForm.eventForm) {
				requiredUsers = targetForm.unit.participants.filter(p => p.state == "accepted")
			} else {
				requiredUsers = await targetForm.unit.listMembers(true).toArray()
				requiredUsers = requiredUsers.unique()
			}

			// Filter out users which have already submitted (or have draft) response
			requiredUsers = requiredUsers.filter(u => !responses.some(r => r.user.id == u.id))

			// Filter out users that are not in the target group
			requiredUsers = requiredUsers.filter(targetForm.userFilter)
			
			counts.required = requiredUsers.length
			if(counts.required < 0) counts.required = 0
		}

	} else {
		// Get responses of all controlled profiles
		await user.populate("children")
		const responseUsers = await user.getControlledProfiles()

		// Get responses of participants from invited units where user has "manageEventInvite" role
		if(targetForm.eventForm) {
			await targetForm.unit.populate({"invitedUnits": "unit"})
			for(const i of targetForm.unit.invitedUnits) {
				if(!await user.hasRoleInUnits("manageEventInvite", i.unit.traverse("upperUnits", {includeSelf: true}))) continue
				responseUsers.push(...i.invitedParticipants.map(p => p.user))
			}
		}

		responses = await targetForm.getUserResponses(responseUsers, {orSubmittedBy: user})
		
		await responses.populate("user", {known: responseUsers})
	}

	// Sort responses by date
	responses.sort((a, b) => b.date - a.date)

	return html("form/page", {
		user,
		targetForm,
		responses,
		counts
	})
}