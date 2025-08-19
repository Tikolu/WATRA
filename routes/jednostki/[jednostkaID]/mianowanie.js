import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetJednostka}) {
	// Check for permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	
	// Get all members for mianowanie
	const usersForMianowanie = []
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue
		await funkcja.populate("jednostka")
		for await(const member of funkcja.jednostka.getSubMembers([user.id])) {
			if(usersForMianowanie.hasID(member.id)) continue
			usersForMianowanie.push(member)
		}
	}
	
	return html("jednostka/mianowanie", {
		user,
		targetJednostka,
		usersForMianowanie
	})
}