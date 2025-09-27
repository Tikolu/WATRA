export default async function({user, targetUser}) {
	await targetUser.medical.confirm()
	
	// Log event
	await user.logEvent("MEDICAL_CONFIRM", {
		targetUser,
		data: targetUser.medical.entries.map(e => [e.title, e.symptoms, e.solutions])
	})
}