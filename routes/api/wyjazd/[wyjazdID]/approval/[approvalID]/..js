export function open({targetWyjazd, approvalID}) {
	const targetApproval = targetWyjazd.approvers.id(approvalID)

	this.addRouteData({targetApproval})
}