export default async function({user, targetWyjazd, approvers}) {
	// Check permissions
	await user.requirePermission(targetWyjazd.PERMISSIONS.MODIFY)

	await targetWyjazd.setApprovers(approvers)
}