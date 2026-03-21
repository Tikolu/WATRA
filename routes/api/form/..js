import HTTPError from "modules/server/error.js"

import Form from "modules/schemas/form"
import Config from "modules/config.js"

import Unit from "modules/schemas/unit"
import Event from "modules/schemas/event"

export function _open({user}) {
	if(!user) throw new HTTPError(403)
}

async function getUnit(user, type, id) {
	if(!Object.keys(types).includes(type)) throw new HTTPError(400, "Nieprawidłowy rodzaj jednostki")
	
	// Get unit from DB, and check if exists
	const targetUnit = await types[type].findById(id)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")
	
	// Check permission
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_FORMS)

	return targetUnit
}

const types = {Unit, Event}
export async function create({user, type, id, name}) {
	const targetUnit = await getUnit(user, type, id)
	
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

	this.addRouteData({
		targetForm: form,
		[`target${type}`]: targetUnit
	})

	return {
		formID: form.id
	}
}

export async function copy({user, type, id, formID}) {
	const targetUnit = await getUnit(user, type, id)

	// Get existing form for copying
	const form = await Form.findById(formID)
	if(!form) throw new HTTPError(404, "Formularz nie istnieje")
	await user.requirePermission(form.PERMISSIONS.EDIT)

	// Create copy of form
	const formObject = form.toObject()
	delete formObject._id
	const formCopy = new Form(formObject)

	formCopy.name = `${form.name} (kopia)`
	formCopy.unit = targetUnit.id
	formCopy.eventForm = type == "Event" ? true : false
	formCopy.config.enabled = false

	targetUnit.forms.push(formCopy.id)

	// Save
	await targetUnit.save()
	await formCopy.save()

	this.addRouteData({
		sourceForm: form.id,
		targetForm: formCopy,
		[`target${type}`]: targetUnit
	})

	return {
		formID: formCopy.id
	}
}