import HTTPError from "modules/server/error.js"

const states = ["pending", "accepted", "declined"]

export default async function({user, targetEvent, targetUsers, participation, signature}) {
	if(!states.includes(participation)) throw new HTTPError(400)
	
	if(participation == "accepted") await user.verifySignature(signature)

	for(const targetUser of targetUsers) {
		// Check permissions
		if(participation == "pending") {
			if(!await user.checkPermission(targetEvent.PERMISSIONS.EDIT_PARTICIPANTS)) {
				await targetEvent.populate({"participants": "originUnit"})
				const participant = targetEvent.participants.id(targetUser.id)
				await user.requirePermission(participant.originUnit.PERMISSIONS.MANAGE_INVITES, "Brak dostępu do użytkownika")
			}
		} else {
			await user.requirePermission(targetUser.PERMISSIONS.APPROVE, "Brak dostępu do użytkownika")
		}

		// Check if target user is a participant
		if(!targetEvent.participants.hasID(targetUser.id)) throw new HTTPError(404, "Użytkownik nie jest uczestnikiem tej akcji")
	}

	const requiredForms = []
	for(const targetUser of targetUsers) {
		const targetInvitation = targetEvent.participants.id(targetUser.id)
		
		// Set participation state
		await targetInvitation.setState(participation)

		// Check for required forms
		if(participation == "accepted") {
			await targetEvent.populate("forms")
			for(const form of targetEvent.forms) {
				if(!form.config.enabled || !form.config.requireResponse) continue
				if(!form.userFilter(targetUser)) continue
				const existing = await form.getUserResponses(targetUser, {check: true})
				if(!existing || !existing.submitted) requiredForms.push({
					form: form.id,
					draft: existing?.id || undefined
				})
			}
		}
	}

	// Save event
	await targetEvent.save()

	return {
		participation,
		requiredFormResponses: requiredForms.length ? requiredForms : undefined
	}
}