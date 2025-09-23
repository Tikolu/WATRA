export default async function({targetUser}) {
	await targetUser.medical.confirm()
}