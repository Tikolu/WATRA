export default async function({user, targetForm, targetResponse, responseUser}) {
	// Check permissions
	await user.requirePermission(targetResponse.PERMISSIONS.EDIT)

	// Check user access
	const userOptions = await targetForm.getResponseUserOptions(user)
	if(!userOptions.hasID(responseUser)) throw new HTTPError(403)

	// Set response user
	targetResponse.user = responseUser.id
	await targetResponse.save()
}