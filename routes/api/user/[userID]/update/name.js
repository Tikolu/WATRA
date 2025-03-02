export default async function({targetUser, input}) {
	// Update names
	targetUser.updateName(input.first, input.last)
	// Save user to DB
	await targetUser.save()

	return {
		first: targetUser.name.first || "",
		last: targetUser.name.last || "",
		display: targetUser.displayName
	}
}