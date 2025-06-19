import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	// Populate wyjazd funkcje, as well as users and jednostki of funkcje
	await targetWyjazd.populate({
		"funkcje": ["user", "jednostka"],
		"participants": ["user", "jednostka"]
	})

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
	}

	await user.checkPermission(targetWyjazd.PERMISSIONS.DELETE)
	
	return html("wyjazd/page", {
		user,
		targetWyjazd,
		usersForMianowanie
	})
}