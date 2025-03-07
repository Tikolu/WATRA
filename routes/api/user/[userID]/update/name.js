export default async function({targetUser, first, last}) {
	// Update names
	await targetUser.updateName(first, last)

	return {
		first: targetUser.name.first || "",
		last: targetUser.name.last || "",
		display: targetUser.displayName
	}
}