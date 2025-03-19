export default async function({user, targetJednostka, targetUser, funkcjaType}) {
	// Check permissions
	await user.requirePermission(targetJednostka.PERMISSIONS.MODIFY)
	await user.requirePermission(targetUser.PERMISSIONS.MODIFY)

	funkcjaType = Number(funkcjaType)
	
	await targetJednostka.setFunkcja(targetUser, funkcjaType)
}