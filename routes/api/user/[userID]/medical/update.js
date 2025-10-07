export default async function({targetUser, category, element, symptoms, solutions}) {
	await targetUser.medical.updateEntry(category, element, symptoms, solutions)
	
	// Disable logging
	this.logging.disabled = true
}