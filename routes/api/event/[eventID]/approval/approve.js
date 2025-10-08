export default async function({targetApprover}) {
	await targetApprover.approve()
}