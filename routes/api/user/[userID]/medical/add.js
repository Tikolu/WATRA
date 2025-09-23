export default async function({targetUser, category, element=""}) {
	await targetUser.medical.updateEntry(category, element, "", "")
}