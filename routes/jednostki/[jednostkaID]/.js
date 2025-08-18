import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Populate jednostka funkcje, as well as users and jednostki of funkcje
	await targetJednostka.populate({
		"funkcje": ["user", "jednostka"]
	})
	// Populate sub and upper jednostki
	await targetJednostka.populate([
		"subJednostki",
		"upperJednostki"
	])
	
	// Sort funkcje
	await targetJednostka.sortFunkcje()
	
	// Load wyjazd invites
	if(await user.checkPermission(targetJednostka.PERMISSIONS.MODIFY)) {
		await targetJednostka.populate("wyjazdInvites")
	}

	await user.checkPermission(targetJednostka.PERMISSIONS.DELETE)
	
	return html("jednostka/page", {
		user,
		targetJednostka
	})
}