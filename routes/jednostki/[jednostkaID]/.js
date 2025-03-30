import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Populate jednostka funkcje, as well as users and jednostki of funkcje
	await targetJednostka.populate("funkcje", ["user", "jednostka"])
	// Populate sub and upper jednostki
	await targetJednostka.populate([
		"subJednostki",
		"upperJednostki"
	])
	
	// Get all members for mianowanie
	const usersForMianowanie = []
	if(await user.checkPermission(targetJednostka.PERMISSIONS.MODIFY)) {
		const subMembers = await Array.fromAsync(targetJednostka.subMembers)
		for(const member of subMembers) {
			// Ignore current user
			if(member.id == user.id) continue
			if(usersForMianowanie.hasID(member.id)) continue
			usersForMianowanie.push(member)
		}

		// Add members of every upperJednostka the user is a drużynowy of
		for await(const jednostka of targetJednostka.upperJednostkiTree) {
			if(user.getFunkcjaInJednostka(jednostka) < FunkcjaType.DRUŻYNOWY) continue
			for(const member of await jednostka.members) {
				if(usersForMianowanie.hasID(member.id)) continue
				usersForMianowanie.push(member)
			}
		}
	}

	await user.checkPermission(targetJednostka.PERMISSIONS.DELETE)

	return html("jednostka/page", {
		user,
		targetJednostka,
		usersForMianowanie
	})
}