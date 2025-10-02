export default async function({user, targetUser, email}) {
	// Update email
	await targetUser.updateEmail(email)

	// Log event
	await user.logEvent("EMAIL_UPDATE", {
		targetUser,
		data: targetUser.email
	})

	return {
		email: targetUser.email
	}
}