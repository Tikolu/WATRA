import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetUnit}) {
	// Check for permissions
	await user.requirePermission(targetUnit.PERMISSIONS.MODIFY)
	
	// Get all members for mianowanie
	const usersForMianowanie = []
	await user.populate("funkcje")
	for(const funkcja of user.funkcje) {
		if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue
		await funkcja.populate("unit")
		for await(const member of funkcja.unit.getSubMembers([user.id])) {
			if(usersForMianowanie.hasID(member.id)) continue
			usersForMianowanie.push(member)
		}
	}
	
	return html("unit/mianowanie", {
		user,
		targetUnit,
		usersForMianowanie
	})
}