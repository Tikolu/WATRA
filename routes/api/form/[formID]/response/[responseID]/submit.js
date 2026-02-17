export default async function({user, targetForm, targetResponse, signature}) {
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.SUBMIT)

	// Submit response
	await targetResponse.submit(user, signature)
}