import HTTPError from "modules/server/error.js"

import Form from "modules/schemas/form"
import Config from "modules/config.js"

import Unit from "modules/schemas/unit"
import Event from "modules/schemas/event"

export function _open({user}) {
	if(!user) throw new HTTPError(403)
}

const types = {Unit, Event}
export async function create({user, type, id, name}) {
	if(!Object.keys(types).includes(type)) throw new HTTPError(400, "Nieprawidłowy rodzaj jednostki")
	
	// Get unit from DB, and check if exists
	const targetUnit = await types[type].findById(id)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")
	
	// Check permission
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_FORMS)
	
	const form = new Form({
		name,
		unit: targetUnit.id,
		eventForm: type == "Event" ? true : false,
		elements: Form.defaultElements
	})

	targetUnit.forms.push(form.id)

	// Save
	await targetUnit.save()
	await form.save()

	return {
		formID: form.id
	}
}