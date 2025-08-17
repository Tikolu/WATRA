import html from "modules/html.js"
import { FunkcjaType } from "modules/types.js"

export default async function({user, targetWyjazd}) {
	const wyjazdData = {}

	await targetWyjazd.populate({
		"invitedJednostki": {
			"jednostka": {},
		}
	})

	if(await user.checkPermission(targetWyjazd.PERMISSIONS.PARTICIPANT_ACCESS)) {
		// Populate wyjazd funkcje, as well as users and jednostki of funkcje
		await targetWyjazd.populate({
			"funkcje": ["user", "jednostka"],
			"invitedJednostki": {
				"invitedUsers": {
					"user": {}
				}
			}
		})

		// Sort funkcje
		await targetWyjazd.sortFunkcje()
		
		if(await user.checkPermission(targetWyjazd.PERMISSIONS.MODIFY)) {
			// Generate list of possible users for mianowanie
			const usersForMianowanie = []

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

			wyjazdData.usersForMianowanie = usersForMianowanie


			// Load approver data
			await targetWyjazd.populate({
				"approvers": {
					"funkcja": ["user", "jednostka"]
				}
			})

		}

	} else {
		user.overridePermission(targetWyjazd.PERMISSIONS.MODIFY, false)

	}

	if(
		await user.checkPermission(targetWyjazd.PERMISSIONS.APPROVE) ||
		await user.checkPermission(targetWyjazd.PERMISSIONS.MODIFY)
	) {
		await targetWyjazd.populate({
			"approvers": {
				"funkcja": ["user", "jednostka"]
			}
		})
	}


	// Check for access to invited jednostki
	for(const jednostkaInvite of targetWyjazd.invitedJednostki || []) {
		await user.checkPermission(jednostkaInvite.jednostka.PERMISSIONS.MODIFY)
	}
	
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



	
	return html("wyjazd/page", {
		user,
		targetWyjazd,
		...wyjazdData
	})
}