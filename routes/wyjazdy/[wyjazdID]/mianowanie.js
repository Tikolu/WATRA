import html from "modules/html.js"

export default async function({user, targetWyjazd}) {
	// Check for permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY)
	
	// Get list of possible users for mianowanie
	const usersForMianowanie = await Array.fromAsync(targetWyjazd.usersForMianowanie())
	
	return html("wyjazd/mianowanie", {
		user,
		targetWyjazd,
		usersForMianowanie
	})
}