export default async function({targetApprover}) {
	await targetApprover.unapprove()
}