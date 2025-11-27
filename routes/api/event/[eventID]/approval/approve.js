export default async function({user, targetApprover, signature}) {
	// Verify signature
	await user.verifySignature(signature)
	
	await targetApprover.approve()
}