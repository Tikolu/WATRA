export default async function({targetUser, email}) {
	targetUser.email = email

	await targetUser.save()

	return {
		email: targetUser.email
	}
}