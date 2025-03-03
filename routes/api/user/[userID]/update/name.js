export default async function({targetUser, input}) {
	// Update names
	await targetUser.updateName(input.first, input.last)

	return {
		first: targetUser.name.first || "",
		last: targetUser.name.last || "",
		display: targetUser.displayName
	}
}