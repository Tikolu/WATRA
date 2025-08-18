import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Check for permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Get all members for mianowanie
	const usersForMianowanie = []
	
	if(await user.checkPermission(targetJednostka.PERMISSIONS.MODIFY)) {
		// Add all subMembers except user
		for await(const member of targetJednostka.getSubMembers([user.id])) {
			usersForMianowanie.push(member)
		}

		// Add members of every upperJednostka the user has access to
		const jednostkiChecked = []
		for await(const jednostka of targetJednostka.getUpperJednostkiTree()) {
			jednostkiChecked.push(jednostka.id)
			console.log("Checking jednostka", jednostka.id)
			if(!await user.checkPermission(jednostka.PERMISSIONS.MODIFY)) continue

			for(const member of await jednostka.getMembers(usersForMianowanie)) {
				usersForMianowanie.push(member)
			}

			// Also check subjednostki
			for(const subJednostka of await jednostka.getSubJednostkiTree(jednostkiChecked)) {
				if(jednostkiChecked.includes(subJednostka.id)) continue
				jednostkiChecked.push(subJednostka.id)
				console.log("Checking jednostka", jednostka.id)

				for(const member of await subJednostka.getMembers(usersForMianowanie)) {
					usersForMianowanie.push(member)
				}
			}
		}
	}
	
	return html("jednostka/mianowanie", {
		user,
		targetJednostka,
		usersForMianowanie
	})
}