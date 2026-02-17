import html from "modules/html.js"

import Unit from "modules/schemas/unit"
import Event from "modules/schemas/event"

export function _open({user}) {
	if(!user) return this.response.redirect("/login")
}

const types = {Unit, Event}
export async function create({user, type, id}) {
	if(!Object.keys(types).includes(type)) throw new HTTPError(400, "Nieprawidłowy rodzaj jednostki")
	
	// Get unit from DB, and check if exists
	const targetUnit = await types[type].findById(id)
	if(!targetUnit) throw new HTTPError(404, "Jednostka nie istnieje")
	
	// Check permission
	await user.requirePermission(targetUnit.PERMISSIONS.MANAGE_FORMS)

	return html("form/create", {
		user,
		targetUnit
	})
}