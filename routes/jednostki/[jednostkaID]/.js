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
	
	// Get all members for mianowanie
	const usersForMianowanie = []
	if(await user.checkPermission(targetJednostka.PERMISSIONS.MODIFY)) {
		// Add all subMembers except user
		for await(const member of targetJednostka.getSubMembers([user.id])) {
			usersForMianowanie.push(member)
		}

		// Add members of every upperJednostka the user is a drużynowy of
		for await(const jednostka of targetJednostka.getUpperJednostkiTree()) {
			if(!await user.checkPermission(jednostka.PERMISSIONS.MODIFY)) continue
			for(const member of await jednostka.getMembers([...usersForMianowanie])) {
				usersForMianowanie.push(member)
			}
		}

		await targetJednostka.populate("wyjazdInvites")
	}

	await user.checkPermission(targetJednostka.PERMISSIONS.DELETE)
	
	return html("jednostka/page", {
		user,
		targetJednostka,
		usersForMianowanie
	})
}