export default async function({targetUser, category, element}) {
	await targetUser.medical.removeEntry(category, element)
}