import html from "modules/html.js"

export default async function({user, targetUnit, orgContext}) {
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_MEMBERS)
	
	const members = await Array.fromAsync(targetUnit.getSubMembers())

	return html("unit/memberList", {
		user,
		targetUnit,
		members,
		orgContext
	})
}