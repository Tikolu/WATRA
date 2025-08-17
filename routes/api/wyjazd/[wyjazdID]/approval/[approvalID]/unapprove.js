export default async function({targetApproval}) {
	await targetApproval.unapprove()
}