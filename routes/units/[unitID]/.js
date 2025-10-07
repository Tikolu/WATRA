import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetUnit}) {
	// Populate unit funkcje, as well as users and units of funkcje
	await targetUnit.populate({
		"funkcje": ["user", "unit"]
	})
	// Populate sub and upper units
	await targetUnit.populate([
		"subUnits",
		"upperUnits"
	])
	
	// Sort funkcje
	await targetUnit.sortFunkcje()
	
	// Load wyjazd invites
	if(await user.checkPermission(targetUnit.PERMISSIONS.MODIFY)) {
		await targetUnit.populate("wyjazdInvites")
	}

	await user.checkPermission(targetUnit.PERMISSIONS.DELETE)
	
	return html("unit/page", {
		user,
		targetUnit
	})
}