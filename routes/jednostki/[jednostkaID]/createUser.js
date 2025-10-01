import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Check for permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Get list of direct subjednostki
	await targetJednostka.populate("subJednostki")
	const jednostki = [targetJednostka, ...targetJednostka.subJednostki]
	
	return html("jednostka/createUser", {
		jednostki
	})
}