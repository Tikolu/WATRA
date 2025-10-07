export default async function({targetUser, firstName, lastName}) {
	// Update names
	await targetUser.updateName(firstName, lastName)

	return {
		firstName: targetUser.name.first || "",
		lastName: targetUser.name.last || "",
		displayName: targetUser.displayName
	}
}