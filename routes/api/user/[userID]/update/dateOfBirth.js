export default async function({user, targetUser, date}) {
	// Check permissions
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)
	
	// Update date of birth
	await targetUser.updateDateOfBirth(date)

	return {
		date: datetime.format(targetUser.dateOfBirth, "yyyy-MM-dd"),
		age: targetUser.age
	}
}