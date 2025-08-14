import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	const wyjazdData = {}
	
	if(await user.checkPermission(targetWyjazd.PERMISSIONS.DATA)) {
		// Populate wyjazd funkcje, as well as users and jednostki of funkcje
		await targetWyjazd.populate({
			"funkcje": ["user", "jednostka"],
			"invitedJednostki": {
				"jednostka": {},
				"invitedUsers": {
					"user": {}
				}
			}
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

			// Check permissions for invited jednostki
			for(const jednostkaInvite of targetWyjazd.invitedJednostki) {
				await user.checkPermission(jednostkaInvite.jednostka.PERMISSIONS.MODIFY)
			}
		}
		wyjazdData.usersForMianowanie = usersForMianowanie

		await user.checkPermission(targetWyjazd.PERMISSIONS.DELETE)

	} else {
		user.overridePermission(targetWyjazd.PERMISSIONS.MODIFY, false)
		user.overridePermission(targetWyjazd.PERMISSIONS.DELETE, false)

		await targetWyjazd.populate({
			"invitedJednostki": {
				"jednostka": {},
			}
		})
	}


	// Check for access to invited jednostki
	for(const jednostkaInvite of targetWyjazd.invitedJednostki || []) {
		await user.checkPermission(jednostkaInvite.jednostka.PERMISSIONS.MODIFY)
	}

	
	if(await user.checkPermission(targetWyjazd.PERMISSIONS.ACCESS)) {	
		// Get participants for approval
		await user.populate("children")
		const participantOptions = [user, ...user.children]
		
		const approvalParticipants = []
		for(const participant of participantOptions) {
			// Check if user is invited to wyjazd
			const userInvite = targetWyjazd.findUserInvite(participant)
			if(!userInvite) continue

			await userInvite.populate("user")

			// Check for approval permission
			if(!await user.checkPermission(participant.PERMISSIONS.APPROVE)) continue

			approvalParticipants.push(userInvite)
		}

		wyjazdData.approvalParticipants = approvalParticipants


	} else {
		throw new HTTPError(403, "Nie masz dostępu do tego wyjazdu")
	}


	
	return html("wyjazd/page", {
		user,
		targetWyjazd,
		...wyjazdData
	})
}