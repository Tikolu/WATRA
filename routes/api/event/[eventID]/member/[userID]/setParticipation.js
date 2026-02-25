import HTTPError from "modules/server/error.js"

export default async function({user, targetEvent, targetUser, participation, signature}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE, "Brak dostępu do użytkownika")

	// Check if target user is a participant
	const targetInvitation = targetEvent.participants.id(targetUser.id)
	if(!targetInvitation) throw new HTTPError(404, "Użytkownik nie jest uczestnikiem tej akcji")

	if(typeof participation != "boolean") throw new HTTPError(400)

	// Verify signature
	if(participation) await user.verifySignature(signature)

	// Set participation state
	await targetInvitation.setState(participation ? "accepted" : "declined")

	// Check for required forms
	const requiredForms = []
	if(participation) {
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

	return {
		participation,
		requiredFormResponses: requiredForms.length ? requiredForms : undefined
	}
}