import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	// Populate wyjazd funkcje, as well as users and jednostki of funkcje
	await targetWyjazd.populate("funkcje", ["user", "jednostka"])

	await user.requirePermission(targetWyjazd.PERMISSIONS.ACCESS, "Nie masz dostępu do tego wyjazdu")
	
	// Sort funkcje
	await targetWyjazd.sortFunkcje()
	
	// Generate list of possible users for mianowanie
	const usersForMianowanie = []
	if(await user.checkPermission(targetWyjazd.PERMISSIONS.MODIFY)) {
		// Get all funkcje already added
		for(const funkcja of targetWyjazd.funkcje) {
			// User cannot mianować themself
			if(user.id == funkcja.user.id) continue
			usersForMianowanie.push(funkcja.user)
		}
		// Get all members (and subMembers) of jednostki in which user is a drużynowy
		await user.populate("funkcje", "jednostka")
		for(const funkcja of user.funkcje) {
			if(funkcja.type < FunkcjaType.DRUŻYNOWY) continue

			// Get all subMembers, excluding already added users
			for await(const member of funkcja.jednostka.getSubMembers([user.id, ...usersForMianowanie])) {
				usersForMianowanie.push(member)
			}
		}
	}

	await user.checkPermission(targetWyjazd.PERMISSIONS.DELETE)
	
	return html("wyjazd/page", {
		user,
		targetWyjazd,
		usersForMianowanie
	})
}