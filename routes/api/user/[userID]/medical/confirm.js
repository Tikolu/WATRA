export default async function({user, targetUser, signature}) {
	await user.requirePermission(targetUser.PERMISSIONS.APPROVE)

	// Verify signature
	await user.verifySignature(signature)

	await targetUser.medical.confirm(signature)
	
	return targetUser.medical.entries.map(e => [e.title, e.symptoms, e.solutions])
}