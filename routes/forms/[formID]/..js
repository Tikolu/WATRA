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
		if(targetForm.config.requireResponse && targetForm.eventForm) {
			counts.required = targetForm.unit.participants.filter(p => p.state == "accepted").length
			counts.required -= counts.submitted + counts.drafts
			if(counts.required < 0) counts.required = 0
		}

	} else {
		// Get responses of user and children for which user has APPROVE permission
		await user.populate("children")
		const responseUsers = [user, ...user.children.filter(child => user.checkPermission(child.PERMISSIONS.APPROVE))]
		responses = await FormResponse.find({
			form: targetForm.id,
			$or: [
				{user: responseUsers.map(user => user.id)},
				{submittedBy: user.id}
			]
		})
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