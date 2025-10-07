export default async function({targetUser, email}) {
	// Update email
	await targetUser.updateEmail(email)

	return {
		email: targetUser.email
	}
}