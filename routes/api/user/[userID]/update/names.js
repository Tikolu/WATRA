export default async function({user, targetUser, firstName, lastName}) {
	// Update names
	await targetUser.updateName(firstName, lastName)

	// Log event
	await user.logEvent("NAME_UPDATE", {
		targetUser,
		data: targetUser.name
	})

	return {
		firstName: targetUser.name.first || "",
		lastName: targetUser.name.last || "",
		displayName: targetUser.displayName
	}
}