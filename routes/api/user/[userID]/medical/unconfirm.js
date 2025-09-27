export default async function({user, targetUser}) {
	await targetUser.medical.unconfirm()

	// Log event
	await user.logEvent("MEDICAL_UNCONFIRM", {
		targetUser,
		data: targetUser.medical.entries
	})
}