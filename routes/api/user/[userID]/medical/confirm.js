export default async function({user, targetUser}) {
	await targetUser.medical.confirm()
	
	return targetUser.medical.entries.map(e => [e.title, e.symptoms, e.solutions])
}